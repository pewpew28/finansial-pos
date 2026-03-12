import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Points to _src/ which is copied by build.mjs before vite runs
      "@": path.resolve(__dirname, "_src"),
    },
  },
  root: __dirname,
  publicDir: path.resolve(__dirname, "_public"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
