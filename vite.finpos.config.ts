import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FinPOS standalone build → dist/finpos/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  root: ".",
  build: {
    outDir: "dist/finpos",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "pos.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  // Override index.html untuk FinPOS
  define: {
    __APP_NAME__: '"FinPOS"',
  },
});
