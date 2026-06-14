// Background presets used behind the code window in the preview canvas.

export interface Background {
  id: string
  label: string
  /** Any valid CSS `background` value. */
  css: string
}

export const BACKGROUNDS: Background[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    css: 'linear-gradient(135deg, #4f8cff 0%, #8b5cf6 45%, #d946ef 100%)',
  },
  {
    id: 'twilight',
    label: 'Twilight',
    css: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 60%, #db2777 100%)',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    css: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    css: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
  },
  {
    id: 'mint',
    label: 'Mint',
    css: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  },
  {
    id: 'slate',
    label: 'Slate',
    css: '#1e293b',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    css: '#0a0a0f',
  },
]

export function backgroundCss(id: string): string {
  return (BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]).css
}
