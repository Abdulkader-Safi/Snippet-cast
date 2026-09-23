import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build also loads from file:// inside Electron.
  base: "./",
  plugins: [svelte(), tailwindcss()],
});
