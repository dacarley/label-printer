import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const buildSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

const buildTime = (() => {
  try {
    return execSync("git log -1 --format=%cI HEAD").toString().trim();
  } catch {
    return "";
  }
})();

// Build a single, fully inlined dist/index.html (JS+CSS inlined)
export default defineConfig({
  base: "/label-printer/",
  plugins: [viteSingleFile()],
  server: {
    host: true,      // same as "0.0.0.0" (listen on all interfaces)
    port: 5173,
    strictPort: true,
  },
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha),
    __BUILD_TIME__: JSON.stringify(buildTime),
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
