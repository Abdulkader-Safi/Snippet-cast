// Core data model for Snippet Cast.

export interface Step {
  id: string
  /** The full code state shown on this frame. */
  code: string
  /** How long to hold this frame before morphing to the next, in ms. */
  durationMs: number
}

export interface ProjectSettings {
  /** Shiki language id, e.g. 'javascript'. */
  language: string
  /** Shiki theme id, e.g. 'vitesse-dark'. */
  theme: string
  /** Background preset id from backgrounds.ts. */
  background: string
  showWindowFrame: boolean
  showLineNumbers: boolean
  /** Code font size in px. */
  fontSize: number
  /** Padding around the code block in px. */
  padding: number
  /** Morph animation duration in ms. */
  transitionMs: number
  /** Aspect ratio preset id from export/resolutions.ts, e.g. '16:9'. */
  aspectRatio: string
}

export interface Project {
  /** Schema version, bumped if the shape changes. */
  version: number
  name: string
  steps: Step[]
  settings: ProjectSettings
}
