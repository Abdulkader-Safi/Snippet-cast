<script lang="ts">
  import CodeCanvas from './lib/components/CodeCanvas.svelte'
  import Timeline from './lib/components/Timeline.svelte'
  import CodeEditor from './lib/components/CodeEditor.svelte'
  import PlaybackControls from './lib/components/PlaybackControls.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Toolbar from './lib/components/Toolbar.svelte'
  import { store, SIDEBAR_MIN, SIDEBAR_MAX } from './lib/store.svelte'
  import { BASE_WIDTH, resolutionById } from './lib/export/resolutions'

  // The preview renders at a fixed logical size (same as export at BASE_WIDTH) and is
  // CSS-scaled to fit, so what you see matches the exported frame.
  let stageW = $state(0)
  let stageH = $state(0)
  const res = $derived(resolutionById(store.settings.aspectRatio))
  const logicalH = $derived(Math.round((BASE_WIDTH * res.height) / res.width))
  const fit = $derived(Math.max(0, Math.min((stageW - 48) / BASE_WIDTH, (stageH - 48) / logicalH)))

  let dragging = $state(false)

  function onHandleDown(e: PointerEvent) {
    dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onHandleMove(e: PointerEvent) {
    if (dragging) store.setSidebarWidth(window.innerWidth - e.clientX)
  }
  function onHandleKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 60 : 20
    if (e.key === 'ArrowLeft') store.setSidebarWidth(store.ui.sidebarWidth + step)
    else if (e.key === 'ArrowRight') store.setSidebarWidth(store.ui.sidebarWidth - step)
  }
</script>

<div class="app">
  <header class="topbar">
    <div class="brand">
      <span class="logo">◆</span>
      Snippet Cast
    </div>
    <Toolbar />
  </header>

  <div class="body" class:dragging style:grid-template-columns="1fr 6px {store.ui.sidebarWidth}px">
    <section class="main">
      <div class="stage" bind:clientWidth={stageW} bind:clientHeight={stageH}>
        <div class="canvas-fit" style:width="{BASE_WIDTH * fit}px" style:height="{logicalH * fit}px">
          <div
            class="canvas-frame"
            style:width="{BASE_WIDTH}px"
            style:height="{logicalH}px"
            style:transform="scale({fit})"
          >
            <CodeCanvas />
          </div>
        </div>
      </div>
      <div class="timeline-bar">
        <div class="controls-row">
          <PlaybackControls />
        </div>
        <Timeline />
      </div>
    </section>

    <!-- A focusable separator is the ARIA window-splitter pattern. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuemin={SIDEBAR_MIN}
      aria-valuemax={SIDEBAR_MAX}
      aria-valuenow={store.ui.sidebarWidth}
      tabindex="0"
      onpointerdown={onHandleDown}
      onpointermove={onHandleMove}
      onpointerup={() => (dragging = false)}
      onpointercancel={() => (dragging = false)}
      ondblclick={() => store.setSidebarWidth(380)}
      onkeydown={onHandleKey}
    ></div>

    <aside class="sidebar">
      <div class="panel editor-panel">
        <CodeEditor />
      </div>
      <div class="panel settings-panel">
        <SettingsPanel />
      </div>
    </aside>
  </div>
</div>

<style>
  .app {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 0;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: #0c0c12;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .logo {
    color: #a855f7;
  }

  .body {
    display: grid;
    min-height: 0;
  }
  .body.dragging {
    cursor: col-resize;
    user-select: none;
  }

  .resize-handle {
    cursor: col-resize;
    background: rgba(255, 255, 255, 0.04);
    transition: background 0.15s;
  }
  .resize-handle:hover,
  .resize-handle:focus-visible,
  .body.dragging .resize-handle {
    background: #a855f7;
    outline: none;
  }

  .main {
    display: grid;
    grid-template-rows: 1fr auto;
    min-height: 0;
    min-width: 0;
  }

  .stage {
    display: grid;
    place-items: center;
    overflow: hidden;
    min-height: 0;
  }

  .canvas-fit {
    position: relative;
  }

  .canvas-frame {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  }

  .timeline-bar {
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    background: #0c0c12;
  }
  .controls-row {
    display: flex;
    justify-content: center;
    padding: 12px 20px 0;
  }

  .sidebar {
    display: grid;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1.2fr);
    min-height: 0;
    background: #0a0a0f;
  }
  .settings-panel {
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  .panel {
    min-height: 0;
    overflow: hidden;
  }
</style>
