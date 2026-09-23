// Animated SVG export. Each step is tokenized through the same Magic Move machine the
// preview uses, so a token keeps its key across steps. Every key becomes one <text>
// with a CSS keyframe track: it moves between its positions, fades in when it appears
// and fades out when it leaves. The result loops forever and plays in any browser,
// including inside an <img> tag.
import { codeToKeyedTokens, createMagicMoveMachine } from '@shikijs/magic-move/core'
import type { Highlighter } from 'shiki'
import type { ProjectSettings, Step } from '../types'
import { backgroundCss } from '../backgrounds'
import { BASE_WIDTH } from './resolutions'

type TokenOptions = Parameters<Highlighter['codeToTokens']>[1]

const FONT = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'

interface Placed {
  x: number
  y: number
}

interface Glyph {
  text: string
  color: string
  fontStyle: number
  dim: boolean
  /** Position per step index; missing = not on screen in that step. */
  at: Map<number, Placed>
}

export interface SvgExportRequest {
  highlighter: Highlighter
  steps: Step[]
  settings: ProjectSettings
  width: number
  height: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const r2 = (n: number) => Math.round(n * 100) / 100

function measureCharWidth(fontSize: number): number {
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `${fontSize}px ${FONT}`
  return ctx.measureText('M'.repeat(100)).width / 100 || fontSize * 0.6
}

/** CSS background preset -> SVG paint. Handles `linear-gradient(<deg>, #hex p%, ...)` and solid colors. */
function backgroundDef(css: string): { defs: string; fill: string } {
  const stops = [...css.matchAll(/(#[0-9a-f]{3,8})\s+(\d+(?:\.\d+)?)%/gi)]
  if (!css.startsWith('linear-gradient') || stops.length === 0) return { defs: '', fill: css }
  const deg = Number(css.match(/(-?\d+(?:\.\d+)?)deg/)?.[1] ?? 180)
  // CSS 0deg points up; convert to a unit vector across the box.
  const rad = (deg * Math.PI) / 180
  const dx = Math.sin(rad) / 2
  const dy = -Math.cos(rad) / 2
  const stopTags = stops.map(([, c, p]) => `<stop offset="${p}%" stop-color="${c}"/>`).join('')
  return {
    defs: `<linearGradient id="bg" x1="${r2(0.5 - dx)}" y1="${r2(0.5 - dy)}" x2="${r2(0.5 + dx)}" y2="${r2(0.5 + dy)}">${stopTags}</linearGradient>`,
    fill: 'url(#bg)',
  }
}

export async function exportAnimatedSvg(req: SvgExportRequest): Promise<Blob> {
  const { highlighter, steps, settings, width, height } = req
  const scale = width / BASE_WIDTH
  const fs = settings.fontSize * scale
  const lh = fs * 1.6
  const pad = settings.padding * scale
  const cw = measureCharWidth(fs)

  const machine = createMagicMoveMachine(
    (code) =>
      codeToKeyedTokens(
        highlighter,
        code,
        { lang: settings.language, theme: settings.theme } as TokenOptions,
        settings.showLineNumbers,
      ),
    { splitTokens: true, enhanceMatching: true },
  )

  const glyphs = new Map<string, Glyph>()
  let maxCols = 1
  let maxLines = 1
  let fg = '#e5e7eb'

  steps.forEach((step, i) => {
    const { current } = machine.commit(step.code.replace(/\t/g, '  '))
    fg = current.fg ?? fg
    let line = 0
    let col = 0
    for (const t of current.tokens) {
      if (t.content === '\n') {
        line++
        col = 0
        continue
      }
      const text = t.content.trim()
      if (text) {
        const lead = t.content.length - t.content.trimStart().length
        let g = glyphs.get(t.key)
        if (!g) {
          g = {
            text,
            color: t.color ?? fg,
            fontStyle: t.fontStyle ?? 0,
            dim: t.htmlClass?.includes('line-number') ?? false,
            at: new Map(),
          }
          glyphs.set(t.key, g)
        }
        g.at.set(i, { x: (col + lead) * cw, y: line * lh })
      }
      col += t.content.length
      maxCols = Math.max(maxCols, col)
    }
    maxLines = Math.max(maxLines, line)
  })

  // Window box sized to the largest step, then shrunk to fit the frame if needed.
  const titleH = settings.showWindowFrame ? 28 * scale : 0
  const winW = maxCols * cw + pad * 2
  const winH = maxLines * lh + pad * 2 + titleH
  const fit = Math.min(1, (width * 0.86) / winW, (height * 0.9) / winH)
  const gx = (width - winW * fit) / 2
  const gy = (height - winH * fit) / 2

  // Timeline: hold step 0, morph, hold step 1, ... Same order as the video export.
  const starts: number[] = []
  const ends: number[] = []
  let t = 0
  steps.forEach((s, i) => {
    starts.push(t)
    t += s.durationMs
    ends.push(t)
    if (i < steps.length - 1) t += settings.transitionMs
  })
  const total = t
  const pct = (ms: number) => r2((ms / total) * 100)

  const css: string[] = []
  const texts: string[] = []
  let n = 0
  const baseline = (lh - fs) / 2 + fs * 0.8

  for (const g of glyphs.values()) {
    const first = g.at.values().next().value!
    const everywhere =
      g.at.size === steps.length && [...g.at.values()].every((p) => p.x === first.x && p.y === first.y)

    let cls = ''
    if (!everywhere) {
      cls = `a${n++}`
      const frames: string[] = []
      const pos = (i: number, prefer: 'prev' | 'next'): Placed => {
        const order = prefer === 'prev' ? [i - 1, i + 1] : [i + 1, i - 1]
        for (const j of order) {
          const p = g.at.get(j)
          if (p) return p
        }
        return first
      }
      steps.forEach((_, i) => {
        const here = g.at.get(i)
        // Hidden tokens park where they fade out from (start of hold) or fade in to (end of hold).
        const a = here ?? pos(i, 'prev')
        const b = here ?? pos(i, 'next')
        const o = here ? 1 : 0
        frames.push(`${pct(starts[i])}%{opacity:${o};transform:translate(${r2(a.x)}px,${r2(a.y)}px)}`)
        frames.push(`${pct(ends[i])}%{opacity:${o};transform:translate(${r2(b.x)}px,${r2(b.y)}px)}`)
      })
      css.push(`@keyframes ${cls}{${frames.join('')}}.${cls}{animation:${cls} ${total}ms ease-in-out infinite}`)
    }

    const style = [
      g.fontStyle & 1 ? 'font-style:italic' : '',
      g.fontStyle & 2 ? 'font-weight:bold' : '',
      g.fontStyle & 4 ? 'text-decoration:underline' : '',
    ]
      .filter(Boolean)
      .join(';')
    // textLength pins each token to the grid even if the viewer's monospace font differs.
    texts.push(
      `<text${cls ? ` class="${cls}"` : ` transform="translate(${r2(first.x)},${r2(first.y)})"`} y="${r2(baseline)}" fill="${g.color}"${g.dim ? ' fill-opacity=".3"' : ''}${style ? ` style="${style}"` : ''} textLength="${r2(g.text.length * cw)}" lengthAdjust="spacingAndGlyphs">${esc(g.text)}</text>`,
    )
  }

  const bg = backgroundDef(backgroundCss(settings.background))
  const radius = 14 * scale
  const dot = 6 * scale
  const chrome = settings.showWindowFrame
    ? `<rect width="${r2(winW)}" height="${r2(winH)}" rx="${r2(radius)}" fill="#0f0f14" fill-opacity=".72" stroke="#fff" stroke-opacity=".08" filter="url(#shadow)"/>` +
      ['#ff5f57', '#febc2e', '#28c840']
        .map((c, k) => `<circle cx="${r2(pad + dot + k * dot * 3.33)}" cy="${r2(pad + dot)}" r="${r2(dot)}" fill="${c}"/>`)
        .join('')
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>${bg.defs}<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${r2(24 * scale)}" stdDeviation="${r2(30 * scale)}" flood-color="#000" flood-opacity=".45"/></filter></defs>
<style>text{font-family:${FONT};font-size:${r2(fs)}px;white-space:pre}${css.join('')}</style>
<rect width="100%" height="100%" fill="${bg.fill}"/>
<g transform="translate(${r2(gx)},${r2(gy)}) scale(${r2(fit)})">${chrome}<g transform="translate(${r2(pad)},${r2(pad + titleH)})">
${texts.join('\n')}
</g></g>
</svg>`

  return new Blob([svg], { type: 'image/svg+xml' })
}
