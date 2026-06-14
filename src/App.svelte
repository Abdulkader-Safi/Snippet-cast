<script lang="ts">
  import CodeCanvas from './lib/components/CodeCanvas.svelte'
  import Timeline from './lib/components/Timeline.svelte'
  import CodeEditor from './lib/components/CodeEditor.svelte'
  import PlaybackControls from './lib/components/PlaybackControls.svelte'
  import SettingsPanel from './lib/components/SettingsPanel.svelte'
  import Toolbar from './lib/components/Toolbar.svelte'
</script>

<div class="app">
  <header class="topbar">
    <div class="brand">
      <span class="logo">◆</span>
      Snippet Cast
    </div>
    <Toolbar />
  </header>

  <div class="body">
    <section class="main">
      <div class="stage">
        <div class="canvas-frame">
          <CodeCanvas />
        </div>
      </div>
      <div class="timeline-bar">
        <div class="controls-row">
          <PlaybackControls />
        </div>
        <Timeline />
      </div>
    </section>

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
    grid-template-columns: 1fr 380px;
    min-height: 0;
  }

  .main {
    display: grid;
    grid-template-rows: 1fr auto;
    min-height: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.07);
  }

  .stage {
    display: grid;
    place-items: center;
    padding: 24px;
    overflow: hidden;
    min-height: 0;
  }

  .canvas-frame {
    width: 100%;
    max-width: 900px;
    aspect-ratio: 16 / 10;
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
