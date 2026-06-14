<script lang="ts">
  import { getHighlighter } from '../highlighter'
  import { backgroundCss } from '../backgrounds'
  import { store } from '../store.svelte'
  import MagicCode from './MagicCode.svelte'

  const s = $derived(store.settings)

  // The store decides morph-vs-snap synchronously per action, so reading it here
  // avoids any cross-component effect-ordering race (which used to make the very
  // first transition snap instead of morph).
  const animate = $derived(store.animateNext)
</script>

<div class="snip-canvas" style:background={backgroundCss(s.background)}>
  <div
    class="snip-window"
    class:framed={s.showWindowFrame}
    style:padding="{s.padding}px"
    style:font-size="{s.fontSize}px"
  >
    {#if s.showWindowFrame}
      <div class="snip-titlebar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
    {/if}

    <div class="snip-code-wrap">
      {#await getHighlighter()}
        <div class="snip-loading">Loading highlighter…</div>
      {:then highlighter}
        {#key `${s.theme}-${s.language}-${s.showLineNumbers}`}
          <MagicCode
            {highlighter}
            code={store.currentStep.code}
            lang={s.language}
            theme={s.theme}
            lineNumbers={s.showLineNumbers}
            duration={s.transitionMs}
            {animate}
          />
        {/key}
      {/await}
    </div>
  </div>
</div>

<style>
  .snip-canvas {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 4%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .snip-window {
    max-width: 100%;
    max-height: 100%;
    border-radius: 14px;
    box-sizing: border-box;
    overflow: hidden;
    background: transparent;
  }

  .snip-window.framed {
    background: rgba(15, 15, 20, 0.72);
    backdrop-filter: blur(8px);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .snip-titlebar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot.red { background: #ff5f57; }
  .dot.yellow { background: #febc2e; }
  .dot.green { background: #28c840; }

  .snip-code-wrap {
    min-width: 0;
  }

  .snip-loading {
    color: rgba(255, 255, 255, 0.6);
    font-family: ui-monospace, monospace;
  }

  :global(.snip-code) {
    margin: 0;
    font-family: ui-monospace, "SF Mono", "Fira Code", Menlo, monospace;
    line-height: 1.6;
    background: transparent !important;
  }
</style>
