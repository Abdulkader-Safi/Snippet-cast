// Reactive app state (Svelte 5 runes) for Snippet Cast.
import type { Project, ProjectSettings, Step } from './types'

const STORAGE_KEY = 'snippetcast:project'
const UI_KEY = 'snippetcast:ui'
const SCHEMA_VERSION = 1

function uid(): string {
  return crypto.randomUUID()
}

const DEFAULT_SETTINGS: ProjectSettings = {
  language: 'javascript',
  theme: 'vitesse-dark',
  background: 'aurora',
  showWindowFrame: true,
  showLineNumbers: true,
  fontSize: 22,
  padding: 32,
  transitionMs: 600,
  aspectRatio: '16:9',
}

function demoSteps(): Step[] {
  const codes = [
    `fetch("https://jsonplaceholder.typicode.com/posts/1")`,
    `fetch("https://jsonplaceholder.typicode.com/posts/1")
  // Handle the raw HTTP response
  .then(res => {

  })`,
    `fetch("https://jsonplaceholder.typicode.com/posts/1")
  // Handle the raw HTTP response
  .then(res => {
    return res.json()
  })`,
    `fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then(res => res.json())
  // Now we have the parsed data
  .then(data => {
    console.log(data)
  })`,
    `fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))`,
  ]
  return codes.map((code) => ({ id: uid(), code, durationMs: 1500 }))
}

function defaultProject(): Project {
  return {
    version: SCHEMA_VERSION,
    name: 'Untitled Snip',
    steps: demoSteps(),
    settings: { ...DEFAULT_SETTINGS },
  }
}

function loadFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Project
    if (!parsed?.steps?.length) return null
    // Merge settings so newly added settings keys get defaults.
    parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings }
    return parsed
  } catch {
    return null
  }
}

/** Editor preferences that belong to this machine, not to the project file. */
export interface UiPrefs {
  vimMode: boolean
  sidebarWidth: number
}

export const SIDEBAR_MIN = 300
export const SIDEBAR_MAX = 760

function loadUi(): UiPrefs {
  const defaults: UiPrefs = { vimMode: false, sidebarWidth: 380 }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(UI_KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

class SnippetCastStore {
  project = $state<Project>(loadFromStorage() ?? defaultProject())
  ui = $state<UiPrefs>(loadUi())
  currentIndex = $state(0)
  isPlaying = $state(false)
  /**
   * Whether the next canvas render should morph (navigation/playback) or snap
   * (code edit). Set synchronously by each action so the preview never has to
   * infer it from effect ordering.
   */
  animateNext = $state(false)
  /** Bumped to cancel an in-flight playback loop. */
  private playToken = 0

  get steps(): Step[] {
    return this.project.steps
  }

  get settings(): ProjectSettings {
    return this.project.settings
  }

  get currentStep(): Step {
    return this.project.steps[this.currentIndex]
  }

  selectStep(index: number) {
    if (index < 0 || index >= this.project.steps.length) return
    this.animateNext = true
    this.currentIndex = index
  }

  addStep() {
    // New frame starts as a copy of the current one, so morphs feel incremental.
    const base = this.currentStep
    const step: Step = { id: uid(), code: base?.code ?? '', durationMs: base?.durationMs ?? 1500 }
    const at = this.currentIndex + 1
    this.animateNext = false
    this.project.steps.splice(at, 0, step)
    this.currentIndex = at
  }

  duplicateStep(index: number) {
    const src = this.project.steps[index]
    if (!src) return
    this.animateNext = false
    this.project.steps.splice(index + 1, 0, { ...src, id: uid() })
    this.currentIndex = index + 1
  }

  deleteStep(index: number) {
    if (this.project.steps.length <= 1) return
    this.animateNext = false
    this.project.steps.splice(index, 1)
    this.currentIndex = Math.min(this.currentIndex, this.project.steps.length - 1)
  }

  reorderStep(from: number, to: number) {
    if (to < 0 || to >= this.project.steps.length) return
    this.animateNext = true
    const [moved] = this.project.steps.splice(from, 1)
    this.project.steps.splice(to, 0, moved)
    this.currentIndex = to
  }

  updateStepCode(code: string) {
    this.animateNext = false
    if (this.currentStep) this.currentStep.code = code
  }

  updateStepDuration(ms: number) {
    if (this.currentStep) this.currentStep.durationMs = ms
  }

  updateSettings(patch: Partial<ProjectSettings>) {
    this.project.settings = { ...this.project.settings, ...patch }
  }

  setSidebarWidth(px: number) {
    this.ui.sidebarWidth = Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, px)))
  }

  setName(name: string) {
    this.project.name = name
  }

  loadProject(project: Project) {
    project.settings = { ...DEFAULT_SETTINGS, ...project.settings }
    this.animateNext = false
    this.project = project
    this.currentIndex = 0
    this.isPlaying = false
  }

  newProject() {
    this.loadProject(defaultProject())
  }

  /** Play through every step from the start, holding each frame for its duration. */
  async play() {
    if (this.steps.length === 0) return
    this.isPlaying = true
    const token = ++this.playToken
    this.animateNext = false
    this.currentIndex = 0
    await wait(this.settings.transitionMs + this.steps[0].durationMs)
    for (let i = 1; i < this.steps.length; i++) {
      if (token !== this.playToken) return
      this.animateNext = true
      this.currentIndex = i
      await wait(this.settings.transitionMs + this.steps[i].durationMs)
    }
    if (token === this.playToken) this.isPlaying = false
  }

  stop() {
    this.playToken++
    this.isPlaying = false
  }

  togglePlay() {
    if (this.isPlaying) this.stop()
    else this.play()
  }
}

export const store = new SnippetCastStore()

// Autosave the whole project to localStorage whenever it changes.
$effect.root(() => {
  $effect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.project))
    } catch {
      // Ignore quota / serialization errors; persistence is best-effort.
    }
  })
  $effect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(store.ui))
    } catch {
      // best-effort
    }
  })
})
