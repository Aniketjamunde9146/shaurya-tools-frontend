import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },

    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ["react", "react-dom"],
          router: ["react-router-dom"]
        }
      }
    }
  },

  server: {
    port: 5173,
    open: true
  }
});