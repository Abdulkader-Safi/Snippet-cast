<script lang="ts">
  import type { Highlighter } from 'shiki'
  import { codeToKeyedTokens, createMagicMoveMachine } from '@shikijs/magic-move/core'
  import { MagicMoveRenderer } from '@shikijs/magic-move/renderer'

  interface Props {
    highlighter: Highlighter
    code: string
    lang: string
    theme: string
    lineNumbers: boolean
    duration: number
    /** Animate the morph (navigation/playback) vs. snap instantly (editing). */
    animate: boolean
  }

  let { highlighter, code, lang, theme, lineNumbers, duration, animate }: Props = $props()

  let container = $state<HTMLPreElement>()
  let renderer: MagicMoveRenderer | undefined
  let ready = $state(false)
  let first = true

  type TokenOptions = Parameters<Highlighter['codeToTokens']>[1]

  // lang / theme / lineNumbers are held constant per instance via a {#key} in the
  // parent, so this machine closure never goes stale.
  const machine = createMagicMoveMachine(
    (c) => codeToKeyedTokens(highlighter, c, { lang, theme } as TokenOptions, lineNumbers),
    { splitTokens: true, enhanceMatching: true },
  )

  $effect(() => {
    if (!container) return
    container.innerHTML = ''
    renderer = new MagicMoveRenderer(container, { duration })
    ready = true
    return () => {
      renderer = undefined
      ready = false
      first = true
    }
  })

  $effect(() => {
    const result = machine.commit(code)
    if (!ready || !renderer) return
    renderer.options.duration = duration
    if (first || !animate) {
      renderer.replace(result.current)
      first = false
    } else {
      renderer.replace(result.previous)
      renderer.render(result.current)
    }
  })
</script>

<pre bind:this={container} class="shiki-magic-move-container snip-code"></pre>
