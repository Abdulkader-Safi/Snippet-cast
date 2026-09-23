<script lang="ts">
  import { store } from '../store.svelte'
  import { THEMES, LANGUAGES } from '../highlighter'
  import { BACKGROUNDS } from '../backgrounds'
  import { RESOLUTIONS } from '../export/resolutions'

  const s = $derived(store.settings)
</script>

<div class="settings">
  <div class="settings-head">Settings</div>

  <div class="grid">
    <label>
      <span>Language</span>
      <select value={s.language} onchange={(e) => store.updateSettings({ language: e.currentTarget.value })}>
        {#each LANGUAGES as l (l.id)}
          <option value={l.id}>{l.label}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Theme</span>
      <select value={s.theme} onchange={(e) => store.updateSettings({ theme: e.currentTarget.value })}>
        {#each THEMES as t (t.id)}
          <option value={t.id}>{t.label}</option>
        {/each}
      </select>
    </label>

    <label class="full">
      <span>Aspect ratio</span>
      <select value={s.aspectRatio} onchange={(e) => store.updateSettings({ aspectRatio: e.currentTarget.value })}>
        {#each RESOLUTIONS as r (r.id)}
          <option value={r.id}>{r.label}</option>
        {/each}
      </select>
    </label>

    <label class="full">
      <span>Background</span>
      <div class="swatches">
        {#each BACKGROUNDS as b (b.id)}
          <button
            class="swatch"
            class:active={s.background === b.id}
            style:background={b.css}
            title={b.label}
            aria-label={b.label}
            onclick={() => store.updateSettings({ background: b.id })}
          ></button>
        {/each}
      </div>
    </label>

    <label class="toggle">
      <input
        type="checkbox"
        checked={s.showWindowFrame}
        onchange={(e) => store.updateSettings({ showWindowFrame: e.currentTarget.checked })}
      />
      <span>Window frame</span>
    </label>

    <label class="toggle">
      <input
        type="checkbox"
        checked={s.showLineNumbers}
        onchange={(e) => store.updateSettings({ showLineNumbers: e.currentTarget.checked })}
      />
      <span>Line numbers</span>
    </label>

    <label class="full">
      <span>Font size <em>{s.fontSize}px</em></span>
      <input
        type="range"
        min="12"
        max="40"
        value={s.fontSize}
        oninput={(e) => store.updateSettings({ fontSize: +e.currentTarget.value })}
      />
    </label>

    <label class="full">
      <span>Padding <em>{s.padding}px</em></span>
      <input
        type="range"
        min="8"
        max="80"
        value={s.padding}
        oninput={(e) => store.updateSettings({ padding: +e.currentTarget.value })}
      />
    </label>

    <label class="full">
      <span>Transition speed <em>{s.transitionMs}ms</em></span>
      <input
        type="range"
        min="100"
        max="1500"
        step="50"
        value={s.transitionMs}
        oninput={(e) => store.updateSettings({ transitionMs: +e.currentTarget.value })}
      />
    </label>

    <label class="full">
      <span>Step {store.currentIndex + 1} hold <em>{store.currentStep.durationMs}ms</em></span>
      <input
        type="range"
        min="300"
        max="5000"
        step="100"
        value={store.currentStep.durationMs}
        oninput={(e) => store.updateStepDuration(+e.currentTarget.value)}
      />
    </label>
  </div>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .settings-head {
    padding: 10px 12px;
    font-size: 12px;
    color: #9ca3af;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 14px;
    overflow: auto;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #cbd5e1;
  }
  label.full {
    grid-column: 1 / -1;
  }
  label em {
    color: #9ca3af;
    font-style: normal;
    float: right;
  }

  select {
    background: #15151c;
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 7px 8px;
    font-size: 13px;
  }

  .toggle {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .toggle input {
    accent-color: #a855f7;
    width: 16px;
    height: 16px;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .swatch {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
  }
  .swatch.active {
    border-color: white;
    box-shadow: 0 0 0 2px #a855f7;
  }

  input[type='range'] {
    accent-color: #a855f7;
    width: 100%;
  }
</style>
