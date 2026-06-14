// Output size presets for video export.

export interface Resolution {
  id: string
  label: string
  width: number
  height: number
}

export const RESOLUTIONS: Resolution[] = [
  { id: '16:9', label: '16:9 · 1080p', width: 1920, height: 1080 },
  { id: '16:10', label: '16:10 · canvas', width: 1920, height: 1200 },
  { id: '9:16', label: '9:16 · vertical', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 · square', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5 · portrait', width: 1080, height: 1350 },
]

/** Base width the editor preview is designed around; export scales relative to this. */
export const BASE_WIDTH = 900

export function resolutionById(id: string): Resolution {
  return RESOLUTIONS.find((r) => r.id === id) ?? RESOLUTIONS[0]
}
