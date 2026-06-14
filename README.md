# Snippet Cast

A tool for turning code into short animated clips, in the style of [snipcast.dev](https://snipcast.dev).
Build a timeline of code "steps"; each step is one code frame, and the app morphs
each frame into the next (token-level slide/fade) on a styled background with a window
frame. Built with Svelte 5, TypeScript, Vite, and Tailwind v4.

## How it works

- **Steps:** the numbered timeline at the bottom is the list of code frames. Step 1
  morphs into step 2 into step 3, and so on. Add (`+`), select, duplicate, delete, and
  drag to reorder.
- **Editing:** edit the current frame's code in the right sidebar; the preview updates
  instantly (no morph while typing). Navigating between steps plays the morph.
- **Animation:** the morph is [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move),
  the same token-diff effect Slidev uses. `Play` runs through every frame with each
  step's hold duration.
- **Customization:** language, syntax theme, background preset, window frame, line
  numbers, font size, padding, transition speed, and per-step hold.
- **Persistence:** the project auto-saves to `localStorage`. `Export JSON` downloads
  the project; `Import` loads one back.

## Develop

```bash
bun install
bun run dev      # start the editor
bun run check    # svelte-check + tsc
bun run build    # production build
```

## Roadmap

- **Export to video** (not yet built): drive playback deterministically frame by frame,
  snapshot the canvas with `modern-screenshot`, and encode with the WebCodecs
  `VideoEncoder` + `mp4-muxer` (MediaRecorder fallback).
