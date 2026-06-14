<script lang="ts">
  import { store } from '../store.svelte'

  let textarea = $state<HTMLTextAreaElement>()

  function onInput(e: Event) {
    store.updateStepCode((e.target as HTMLTextAreaElement).value)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target as HTMLTextAreaElement
      const start = el.selectionStart
      const end = el.selectionEnd
      const value = el.value
      el.value = value.slice(0, start) + '  ' + value.slice(end)
      el.selectionStart = el.selectionEnd = start + 2
      store.updateStepCode(el.value)
    }
  }
</script>

<div class="editor">
  <div class="editor-head">
    <span>Step {store.currentIndex + 1} code</span>
    <span class="hint">edits update the preview instantly</span>
  </div>
  <textarea
    bind:this={textarea}
    class="code-input"
    spellcheck="false"
    autocomplete="off"
    autocapitalize="off"
    value={store.currentStep.code}
    oninput={onInput}
    onkeydown={onKeydown}
  ></textarea>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .editor-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 10px 12px;
    font-size: 12px;
    color: #9ca3af;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  .hint {
    font-size: 11px;
    opacity: 0.6;
  }

  .code-input {
    flex: 1;
    min-height: 0;
    resize: none;
    border: none;
    outline: none;
    background: #0e0e14;
    color: #e5e7eb;
    padding: 14px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 13px;
    line-height: 1.55;
    tab-size: 2;
    white-space: pre;
    overflow: auto;
  }
</style>
