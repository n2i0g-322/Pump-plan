import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** Drop ORT WASM from the deploy; plateAnalyze loads WASM from jsDelivr at runtime. */
function skipOrtWasm(): Plugin {
  return {
    name: "skip-ort-wasm",
    generateBundle(_opts, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith(".wasm") && fileName.includes("ort-wasm")) {
          delete bundle[fileName];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), skipOrtWasm()],
  // GitHub Pages serves at https://n2i0g-322.github.io/Pump-plan/
  base: "/Pump-plan/",
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
