<script lang="ts">
  import { tick } from 'svelte'
  import { store } from '../store.svelte'
  import { getHighlighter } from '../highlighter'
  import { resolutionById } from '../export/resolutions'
  import { runExport, downloadBlob, estimateFrames, type ExportFormat } from '../export/exportVideo'
  import { exportAnimatedSvg } from '../export/exportSvg'
  import { webCodecsAvailable } from '../export/sinks'
  import ExportStage from '../export/ExportStage.svelte'

  interface Props {
    open: boolean
    onClose: () => void
  }
  let { open, onClose }: Props = $props()

  type Format = ExportFormat | 'svg'

  const FORMATS: { id: Format; label: string; needsCodecs: boolean }[] = [
    { id: 'mp4', label: 'MP4', needsCodecs: true },
    { id: 'webm', label: 'WebM', needsCodecs: true },
    { id: 'gif', label: 'GIF', needsCodecs: false },
    { id: 'svg', label: 'Animated SVG', needsCodecs: false },
  ]

  const canVideo = webCodecsAvailable()

  let format = $state<Format>(canVideo ? 'mp4' : 'gif')
  let fps = $state(30)

  let status = $state<'idle' | 'rendering' | 'done' | 'error'>('idle')
  let done = $state(0)
  let total = $state(0)
  let errorMsg = $state('')
  let resultSize = $state(0)

  let preEl = $state<HTMLPreElement>()
  let stageEl = $state<HTMLDivElement>()

  // GIF gets downscaled and frame-rate-capped to keep file size sane.
  const resolutionId = $derived(store.settings.aspectRatio)
  const res = $derived(resolutionById(resolutionId))
  const isGif = $derived(format === 'gif')
  const isSvg = $derived(format === 'svg')
  const exportFps = $derived(isGif ? Math.min(fps, 15) : fps)
  const dims = $derived.by(() => {
    if (!isGif) return { width: res.width, height: res.height }
    const cap = 800
    const scale = Math.min(1, cap / Math.max(res.width, res.height))
    const even = (n: number) => Math.round((n * scale) / 2) * 2
    return { width: even(res.width), height: even(res.height) }
  })

  const pct = $derived(total > 0 ? Math.round((done / total) * 100) : 0)
  const frameEstimate = $derived(estimateFrames(store.steps, store.settings.transitionMs, exportFps))

  function fmtSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  async function start() {
    if (!canVideo && format !== 'gif') return
    // Snapshot the whole config up front so the export stays consistent even if
    // reactive state changes mid-render (otherwise the file extension and the
    // encoded bytes could diverge, e.g. GIF content saved as `.mp4`).
    const cfg = { format, width: dims.width, height: dims.height, fps: exportFps, resId: resolutionId }
    status = 'rendering'
    done = 0
    total = frameEstimate
    errorMsg = ''
    await tick()
    if (!preEl || !stageEl) {
      status = 'error'
      errorMsg = 'Export stage not ready.'
      return
    }
    try {
      const highlighter = await getHighlighter()
      const blob = cfg.format === 'svg'
        ? await exportAnimatedSvg({
            highlighter,
            steps: store.steps,
            settings: store.settings,
            width: cfg.width,
            height: cfg.height,
          })
        : await runExport({
        format: cfg.format,
        width: cfg.width,
        height: cfg.height,
        fps: cfg.fps,
        highlighter,
        preEl,
        stageEl,
        steps: store.steps,
        settings: store.settings,
        onProgress: (d, t) => {
          done = d
          total = t
        },
      })
      resultSize = blob.size
      const name =
        (store.project.name.trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'snip') +
        `-${cfg.resId.replace(':', 'x')}`
      downloadBlob(blob, `${name}.${cfg.format}`)
      status = 'done'
    } catch (e) {
      status = 'error'
      errorMsg = e instanceof Error ? e.message : String(e)
    }
  }

  function close() {
    if (status === 'rendering') return
    status = 'idle'
    onClose()
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === 'Escape') close()
  }}
/>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="overlay" onclick={close} role="presentation">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Export" tabindex="-1">
      <div class="head">
        <h2>Export</h2>
        <button class="x" onclick={close} disabled={status === 'rendering'}>✕</button>
      </div>

      <div class="field">
        <span class="label">Format</span>
        <div class="segments">
          {#each FORMATS as f (f.id)}
            <button
              class="segment"
              class:active={format === f.id}
              disabled={f.needsCodecs && !canVideo}
              title={f.needsCodecs && !canVideo ? 'WebCodecs not available in this browser' : ''}
              onclick={() => (format = f.id)}
            >
              {f.label}
            </button>
          {/each}
        </div>
        {#if !canVideo}
          <span class="note">MP4/WebM need WebCodecs (use Chrome). GIF works everywhere.</span>
        {/if}
      </div>

      {#if isSvg}
        <span class="note svg-note">
          Vector file that loops forever. Plays in browsers, GitHub READMEs and docs sites. Social apps
          don't accept SVG, so use MP4 there.
        </span>
      {:else}
      <div class="field">
        <span class="label">Frame rate</span>
        <div class="segments">
          <button class="segment" class:active={fps === 30} onclick={() => (fps = 30)}>30 fps</button>
          <button class="segment" class:active={fps === 60} onclick={() => (fps = 60)}>60 fps</button>
        </div>
        {#if isGif && fps > 15}
          <span class="note">GIF is capped at 15 fps and {dims.width}×{dims.height} to keep the file small.</span>
        {/if}
      </div>
      {/if}

      <div class="summary">
        {res.label} (change it in Settings) · {store.steps.length} steps · {dims.width}×{dims.height}{isSvg
          ? ''
          : ` · ${exportFps} fps · ~${frameEstimate} frames`}
      </div>

      {#if status === 'rendering'}
        <div class="progress">
          <div class="bar" style:width="{pct}%"></div>
        </div>
        <div class="progress-text">{isSvg ? 'Building SVG…' : 'Rendering frames…'} {done}/{total} ({pct}%)</div>
      {:else if status === 'done'}
        <div class="result ok">Done. Downloaded {format.toUpperCase()} · {fmtSize(resultSize)}</div>
      {:else if status === 'error'}
        <div class="result err">Export failed: {errorMsg}</div>
      {/if}

      <div class="actions">
        <button class="ghost" onclick={close} disabled={status === 'rendering'}>Close</button>
        <button class="primary" onclick={start} disabled={status === 'rendering' || (!canVideo && format !== 'gif')}>
          {status === 'rendering' ? 'Rendering…' : status === 'done' ? 'Export again' : 'Render & download'}
        </button>
      </div>

      <ExportStage bind:preEl bind:stageEl width={dims.width} height={dims.height} settings={store.settings} />
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    z-index: 100;
  }

  .dialog {
    width: 440px;
    max-width: 92vw;
    background: #14141b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .head h2 {
    margin: 0;
    font-size: 16px;
  }
  .x {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 14px;
  }

  .field {
    margin-bottom: 16px;
  }
  .label {
    display: block;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 7px;
  }

  .segments {
    display: flex;
    gap: 6px;
  }
  .segment {
    flex: 1;
    padding: 8px;
    background: #1d1d25;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
  }
  .segment.active {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-color: transparent;
    color: white;
    font-weight: 600;
  }
  .segment:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .svg-note {
    margin: -6px 0 16px;
    line-height: 1.5;
  }

  .note {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: #c084fc;
  }

  .summary {
    font-size: 12px;
    color: #9ca3af;
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    margin-top: 4px;
  }

  .progress {
    height: 8px;
    background: #1d1d25;
    border-radius: 5px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #a855f7);
    transition: width 0.1s linear;
  }
  .progress-text {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 6px;
  }

  .result {
    font-size: 13px;
    padding: 8px 10px;
    border-radius: 8px;
  }
  .result.ok {
    background: #14301f;
    color: #86efac;
  }
  .result.err {
    background: #3a1414;
    color: #fca5a5;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
  }
  .ghost {
    background: #1d1d25;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    font-size: 13px;
  }
  .primary {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border: none;
    color: white;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }
  .primary:disabled,
  .ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
