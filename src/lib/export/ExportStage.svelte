<script lang="ts">
  import { backgroundCss } from '../backgrounds'
  import { BASE_WIDTH } from './resolutions'
  import type { ProjectSettings } from '../types'

  interface Props {
    width: number
    height: number
    settings: ProjectSettings
    /** The <pre> element the capture loop renders tokens into. */
    preEl?: HTMLPreElement
    /** The full stage element that gets rasterized into video frames. */
    stageEl?: HTMLDivElement
  }

  let { width, height, settings, preEl = $bindable(), stageEl = $bindable() }: Props = $props()

  // Scale the code chrome with the output width so it looks like the editor preview.
  const scale = $derived(width / BASE_WIDTH)
</script>

<div
  bind:this={stageEl}
  class="export-stage"
  style:width="{width}px"
  style:height="{height}px"
  style:background={backgroundCss(settings.background)}
>
  <div
    class="export-window"
    class:framed={settings.showWindowFrame}
    style:padding="{settings.padding * scale}px"
    style:font-size="{settings.fontSize * scale}px"
    style:border-radius="{14 * scale}px"
  >
    {#if settings.showWindowFrame}
      <div class="titlebar" style:margin-bottom="{16 * scale}px" style:gap="{8 * scale}px">
        <span class="dot" style:width="{12 * scale}px" style:height="{12 * scale}px" style:background="#ff5f57"></span>
        <span class="dot" style:width="{12 * scale}px" style:height="{12 * scale}px" style:background="#febc2e"></span>
        <span class="dot" style:width="{12 * scale}px" style:height="{12 * scale}px" style:background="#28c840"></span>
      </div>
    {/if}
    <pre bind:this={preEl} class="shiki-magic-move-container export-code"></pre>
  </div>
</div>

<style>
  .export-stage {
    position: fixed;
    top: 0;
    left: -100000px;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    overflow: hidden;
    z-index: -1;
  }

  .export-window {
    max-width: 86%;
    box-sizing: border-box;
    overflow: hidden;
    background: transparent;
  }
  .export-window.framed {
    background: rgba(15, 15, 20, 0.72);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .titlebar {
    display: flex;
  }
  .dot {
    border-radius: 50%;
    display: inline-block;
  }

  .export-code {
    margin: 0;
    font-family: ui-monospace, "SF Mono", "Fira Code", Menlo, monospace;
    line-height: 1.6;
    background: transparent !important;
    white-space: pre;
  }
</style>
