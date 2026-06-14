// Frame sinks: consume captured frame canvases and produce an encoded file Blob.
// MP4 and WebM go through WebCodecs VideoEncoder + a muxer; GIF uses gifenc.
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer'
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

export interface FrameSink {
  /** Add one frame. `index` is the running frame number (monotonic from 0). */
  add(canvas: HTMLCanvasElement, index: number): Promise<void> | void
  /** Flush and return the encoded file. */
  finish(): Promise<Blob>
}

export function webCodecsAvailable(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window
}

function bitrateFor(width: number, height: number, fps: number): number {
  // ~0.08 bits per pixel per frame, clamped to a sensible range.
  const raw = width * height * fps * 0.08
  return Math.round(Math.min(24_000_000, Math.max(2_000_000, raw)))
}

/** A reusable canvas of the exact output size; captured frames are drawn onto it. */
function makeNormalizer(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  return {
    canvas,
    draw(src: HTMLCanvasElement) {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(src, 0, 0, width, height)
    },
    imageData() {
      return ctx.getImageData(0, 0, width, height)
    },
  }
}

async function pickCodec(candidates: string[], base: { width: number; height: number; framerate: number; bitrate: number }) {
  for (const codec of candidates) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({ codec, ...base })
      if (supported) return codec
    } catch {
      /* try next */
    }
  }
  return null
}

async function createWebCodecsSink(
  kind: 'mp4' | 'webm',
  width: number,
  height: number,
  fps: number,
): Promise<FrameSink> {
  const bitrate = bitrateFor(width, height, fps)
  const base = { width, height, framerate: fps, bitrate }

  const codec =
    kind === 'mp4'
      ? await pickCodec(['avc1.640028', 'avc1.4d0028', 'avc1.42e01e'], base)
      : await pickCodec(['vp09.00.40.08', 'vp09.00.41.08', 'vp09.00.10.08', 'vp8'], base)

  if (!codec) throw new Error(`No supported ${kind.toUpperCase()} codec in this browser.`)

  const norm = makeNormalizer(width, height)
  const frameDur = 1_000_000 / fps
  const keyEvery = Math.max(1, Math.round(fps * 2))

  let muxer: Mp4Muxer<Mp4Target> | WebmMuxer<WebmTarget>
  if (kind === 'mp4') {
    muxer = new Mp4Muxer({
      target: new Mp4Target(),
      video: { codec: 'avc', width, height, frameRate: fps },
      fastStart: 'in-memory',
    })
  } else {
    muxer = new WebmMuxer({
      target: new WebmTarget(),
      video: { codec: 'V_VP9', width, height, frameRate: fps },
    })
  }

  let encoderError: unknown = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encoderError = e),
  })
  encoder.configure({ codec, ...base })

  return {
    add(src, index) {
      if (encoderError) throw encoderError
      norm.draw(src)
      const frame = new VideoFrame(norm.canvas, {
        timestamp: Math.round(index * frameDur),
        duration: Math.round(frameDur),
      })
      encoder.encode(frame, { keyFrame: index % keyEvery === 0 })
      frame.close()
    },
    async finish() {
      await encoder.flush()
      if (encoderError) throw encoderError
      muxer.finalize()
      const buffer = (muxer.target as Mp4Target | WebmTarget).buffer
      return new Blob([buffer], { type: kind === 'mp4' ? 'video/mp4' : 'video/webm' })
    },
  }
}

export function createMp4Sink(width: number, height: number, fps: number) {
  return createWebCodecsSink('mp4', width, height, fps)
}

export function createWebmSink(width: number, height: number, fps: number) {
  return createWebCodecsSink('webm', width, height, fps)
}

export function createGifSink(width: number, height: number, fps: number): FrameSink {
  const gif = GIFEncoder()
  const norm = makeNormalizer(width, height)
  const frameDelay = Math.round(1000 / fps)

  // Merge consecutive identical frames (holds) into one frame with a longer delay.
  let prevBytes: Uint8ClampedArray | null = null
  let pending: { index: Uint8Array; palette: number[][]; delay: number } | null = null

  function sameAsPrev(bytes: Uint8ClampedArray): boolean {
    if (!prevBytes || prevBytes.length !== bytes.length) return false
    for (let i = 0; i < bytes.length; i += 4 * 97) {
      // sparse sample first for a fast reject, then full compare
      if (bytes[i] !== prevBytes[i]) return false
    }
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== prevBytes[i]) return false
    return true
  }

  function flush() {
    if (pending) {
      gif.writeFrame(pending.index, width, height, { palette: pending.palette, delay: pending.delay })
      pending = null
    }
  }

  return {
    add(src) {
      norm.draw(src)
      const data = norm.imageData().data
      if (pending && sameAsPrev(data)) {
        pending.delay += frameDelay
        return
      }
      flush()
      const rgba = new Uint8Array(data.buffer.slice(0))
      const palette = quantize(rgba, 256)
      const indexed = applyPalette(rgba, palette)
      pending = { index: indexed, palette, delay: frameDelay }
      prevBytes = data.slice(0)
    },
    async finish() {
      flush()
      gif.finish()
      return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
    },
  }
}
