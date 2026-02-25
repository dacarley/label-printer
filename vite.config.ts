import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build a single, fully inlined dist/index.html (JS+CSS inlined)
export default defineConfig({
  base: "/label-printer/",
  plugins: [viteSingleFile()],
  server: {
    host: true,      // same as "0.0.0.0" (listen on all interfaces)
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2019",
    cssCodeSplit: false,
    assetsInlineLimit: 1e9,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
