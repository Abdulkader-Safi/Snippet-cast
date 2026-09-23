<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror'
  import { Compartment, EditorState } from '@codemirror/state'
  import { keymap } from '@codemirror/view'
  import { indentWithTab } from '@codemirror/commands'
  import { indentUnit, LanguageDescription } from '@codemirror/language'
  import { languages } from '@codemirror/language-data'
  import { oneDark } from '@codemirror/theme-one-dark'
  import { vim } from '@replit/codemirror-vim'
  import { untrack } from 'svelte'
  import { store } from '../store.svelte'

  let host = $state<HTMLDivElement>()
  let view: EditorView | undefined

  const vimSlot = new Compartment()
  const langSlot = new Compartment()

  // Shiki ids that CodeMirror's language-data names differently.
  const CM_NAMES: Record<string, string> = { bash: 'shell' }

  const theme = EditorView.theme({
    '&': { height: '100%', fontSize: '13px', backgroundColor: '#0e0e14' },
    '.cm-gutters': { backgroundColor: '#0e0e14', border: 'none' },
    '.cm-scroller': { fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', lineHeight: '1.55' },
    '&.cm-focused': { outline: 'none' },
  })

  $effect(() => {
    if (!host) return
    const parent = host
    // untrack: the editor is built once; the effects below push later changes into it.
    view = untrack(() => new EditorView({
      parent,
      state: EditorState.create({
        doc: store.currentStep.code,
        extensions: [
          // vim must sit before the other keymaps so it sees keys first.
          vimSlot.of(store.ui.vimMode ? vim() : []),
          basicSetup,
          keymap.of([indentWithTab]),
          indentUnit.of('  '),
          EditorState.tabSize.of(2),
          langSlot.of([]),
          oneDark,
          theme,
          EditorView.updateListener.of((u) => {
            if (!u.docChanged) return
            const code = u.state.doc.toString()
            // Skip our own step-switch sync; updateStepCode would turn the morph into a snap.
            if (code !== store.currentStep.code) store.updateStepCode(code)
          }),
        ],
      }),
    }))
    return () => {
      view?.destroy()
      view = undefined
    }
  })

  // Step switches (and imports) replace the document; typing already matches, so it's skipped.
  $effect(() => {
    const code = store.currentStep.code
    if (!view || view.state.doc.toString() === code) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } })
  })

  $effect(() => {
    const on = store.ui.vimMode
    view?.dispatch({ effects: vimSlot.reconfigure(on ? vim() : []) })
  })

  $effect(() => {
    const id = store.settings.language
    const desc = LanguageDescription.matchLanguageName(languages, CM_NAMES[id] ?? id, true)
    if (!desc) {
      view?.dispatch({ effects: langSlot.reconfigure([]) })
      return
    }
    desc.load().then((support) => {
      if (store.settings.language === id) view?.dispatch({ effects: langSlot.reconfigure(support) })
    })
  })
</script>

<div class="editor">
  <div class="editor-head">
    <span>Step {store.currentIndex + 1} code</span>
    <label class="vim-toggle" title="Vim keybindings">
      <input type="checkbox" bind:checked={store.ui.vimMode} />
      <span>Vim</span>
    </label>
  </div>
  <div class="cm-host" bind:this={host}></div>
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
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 12px;
    color: #9ca3af;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .vim-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .vim-toggle input {
    accent-color: #a855f7;
  }

  .cm-host {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .cm-host :global(.cm-editor) {
    height: 100%;
  }
</style>
