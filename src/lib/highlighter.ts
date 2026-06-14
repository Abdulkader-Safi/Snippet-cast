// Lazy singleton Shiki highlighter shared across the app.
import { createHighlighter, type Highlighter } from 'shiki'

export const THEMES = [
  { id: 'vitesse-dark', label: 'Vitesse Dark' },
  { id: 'github-dark', label: 'GitHub Dark' },
  { id: 'nord', label: 'Nord' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'one-dark-pro', label: 'One Dark Pro' },
  { id: 'vitesse-light', label: 'Vitesse Light' },
]

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Shell' },
]

const THEME_IDS = THEMES.map((t) => t.id)
const LANG_IDS = LANGUAGES.map((l) => l.id)

let instance: Highlighter | null = null
let pending: Promise<Highlighter> | null = null

/** Returns the shared highlighter, creating it on first call. */
export async function getHighlighter(): Promise<Highlighter> {
  if (instance) return instance
  if (!pending) {
    pending = createHighlighter({
      themes: THEME_IDS,
      langs: LANG_IDS,
    }).then((hl) => {
      instance = hl
      return hl
    })
  }
  return pending
}
