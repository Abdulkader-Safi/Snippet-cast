// Deterministically captures the Magic Move morph frame by frame.
//
// The trick: Magic Move animates with CSS transitions. We kick off a transition,
// grab the resulting Animation objects, pause them, then walk `currentTime` in
// fixed fps steps — rasterizing the stage at each tick. CSS transitions are
// exposed as seekable Animations, so this reproduces the exact on-screen morph.
import { MagicMoveRenderer } from '@shikijs/magic-move/renderer'
import { codeToKeyedTokens } from '@shikijs/magic-move/core'
import { domToCanvas } from 'modern-screenshot'
import type { Highlighter } from 'shiki'

export interface CaptureStep {
  code: string
  durationMs: number
}

export interface CaptureOptions {
  highlighter: Highlighter
  preEl: HTMLElement
  stageEl: HTMLElement
  steps: CaptureStep[]
  lang: string
  theme: string
  lineNumbers: boolean
  transitionMs: number
  fps: number
  width: number
  height: number
  /** Called for every produced frame, in order. */
  onFrame: (canvas: HTMLCanvasElement, index: number, total: number) => Promise<void> | void
}

type TokenOptions = Parameters<Highlighter['codeToTokens']>[1]

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

export function frameCount(steps: CaptureStep[], transitionMs: number, fps: number): number {
  let total = 0
  for (let i = 0; i < steps.length; i++) {
    total += Math.max(1, Math.round((steps[i].durationMs / 1000) * fps))
    if (i < steps.length - 1) total += Math.max(1, Math.round((transitionMs / 1000) * fps))
  }
  return total
}

export async function captureFrames(opts: CaptureOptions): Promise<void> {
  const { highlighter, preEl, stageEl, steps, lang, theme, lineNumbers, transitionMs, fps, width, height } = opts
  const total = frameCount(steps, transitionMs, fps)

  const tokensFor = (code: string) =>
    codeToKeyedTokens(highlighter, code, { lang, theme } as TokenOptions, lineNumbers)

  const rasterize = () =>
    domToCanvas(stageEl, { width, height, scale: 1, backgroundColor: undefined })

  preEl.innerHTML = ''
  const renderer = new MagicMoveRenderer(preEl, { duration: transitionMs })
  renderer.options.duration = transitionMs

  let frameIndex = 0
  const emit = async (canvas: HTMLCanvasElement) => {
    await opts.onFrame(canvas, frameIndex++, total)
  }

  // Initial frame state.
  renderer.replace(tokensFor(steps[0].code))
  await nextFrame()

  for (let i = 0; i < steps.length; i++) {
    // Hold frames: rasterize the static state once, emit it for the duration.
    const holdFrames = Math.max(1, Math.round((steps[i].durationMs / 1000) * fps))
    renderer.replace(tokensFor(steps[i].code))
    await nextFrame()
    const held = await rasterize()
    for (let h = 0; h < holdFrames; h++) await emit(held)

    // Morph frames: step i -> i+1.
    if (i < steps.length - 1) {
      const morphFrames = Math.max(1, Math.round((transitionMs / 1000) * fps))
      renderer.replace(tokensFor(steps[i].code))
      const done = renderer.render(tokensFor(steps[i + 1].code))

      // Collect the freshly started transitions and freeze them.
      let anims = preEl.getAnimations({ subtree: true })
      if (anims.length === 0) {
        await nextFrame()
        anims = preEl.getAnimations({ subtree: true })
      }
      anims.forEach((a) => a.pause())

      for (let f = 1; f <= morphFrames; f++) {
        const t = (f / morphFrames) * transitionMs
        anims.forEach((a) => {
          try {
            a.currentTime = t
          } catch {
            // Some animations may have settled; ignore.
          }
        })
        await nextFrame()
        await emit(await rasterize())
      }

      // Let the renderer settle into the final state for the next iteration.
      anims.forEach((a) => {
        try {
          a.finish()
        } catch {
          /* noop */
        }
      })
      await done.catch(() => {})
    }
  }
}
