// Aspect ratio presets. The same ratio drives the preview canvas and the export size.

export interface Resolution {
  id: string
  label: string
  width: number
  height: number
}

export const RESOLUTIONS: Resolution[] = [
  { id: '16:9', label: '16:9 · YouTube', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16 · Reels, TikTok', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 · square', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5 · Instagram feed', width: 1080, height: 1350 },
  { id: '4:3', label: '4:3 · slides', width: 1440, height: 1080 },
  { id: '21:9', label: '21:9 · ultrawide', width: 2560, height: 1080 },
  { id: '16:10', label: '16:10 · laptop', width: 1920, height: 1200 },
]

/** Base width the editor preview is designed around; export scales relative to this. */
export const BASE_WIDTH = 900

export function resolutionById(id: string): Resolution {
  return RESOLUTIONS.find((r) => r.id === id) ?? RESOLUTIONS[0]
}
