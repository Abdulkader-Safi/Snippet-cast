// Orchestrates an export: pick a sink, drive the capture loop into it, return a Blob.
import type { Highlighter } from 'shiki'
import type { ProjectSettings, Step } from '../types'
import { captureFrames, frameCount } from './captureFrames'
import { createMp4Sink, createWebmSink, createGifSink } from './sinks'

export type ExportFormat = 'mp4' | 'webm' | 'gif'

export interface ExportRequest {
  format: ExportFormat
  width: number
  height: number
  fps: number
  highlighter: Highlighter
  preEl: HTMLElement
  stageEl: HTMLElement
  steps: Step[]
  settings: ProjectSettings
  onProgress?: (done: number, total: number) => void
}

export function estimateFrames(steps: Step[], transitionMs: number, fps: number): number {
  return frameCount(steps, transitionMs, fps)
}

export async function runExport(req: ExportRequest): Promise<Blob> {
  const { format, width, height, fps } = req

  const sink = await (format === 'mp4'
    ? createMp4Sink(width, height, fps)
    : format === 'webm'
      ? createWebmSink(width, height, fps)
      : createGifSink(width, height, fps))

  await captureFrames({
    highlighter: req.highlighter,
    preEl: req.preEl,
    stageEl: req.stageEl,
    steps: req.steps,
    lang: req.settings.language,
    theme: req.settings.theme,
    lineNumbers: req.settings.showLineNumbers,
    transitionMs: req.settings.transitionMs,
    fps,
    width,
    height,
    onFrame: async (canvas, index, total) => {
      await sink.add(canvas, index)
      req.onProgress?.(index + 1, total)
    },
  })

  return sink.finish()
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
