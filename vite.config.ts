import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves at https://n2i0g-322.github.io/Pump-plan/
  base: "/Pump-plan/",
});
