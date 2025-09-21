// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    sourcemap: mode !== "production", // aktifkan sourcemap hanya di dev
    chunkSizeWarningLimit: 900,       // biar warning gak sering muncul
    minify: "esbuild",                // lebih cepat & kecil
  },
  esbuild:
    mode === "production"
      ? { drop: ["console", "debugger"] } // hapus console.* & debugger
      : {},
}));
