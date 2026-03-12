import { execSync } from "child_process";
import { existsSync, renameSync, copyFileSync } from "fs";
import { resolve } from "path";

console.log("🏗️  Building FinPOS...");

// Run vite build
execSync("npx vite build --config vite.finpos.config.ts", { stdio: "inherit" });

// Rename pos.html → index.html di output folder
const posHtml = resolve("dist/finpos/pos.html");
const indexHtml = resolve("dist/finpos/index.html");

if (existsSync(posHtml)) {
  renameSync(posHtml, indexHtml);
  console.log("✅ Renamed pos.html → index.html");
} else if (existsSync(indexHtml)) {
  console.log("✅ index.html already exists");
} else {
  console.error("❌ pos.html not found in dist/finpos/");
  process.exit(1);
}

console.log("🎉 FinPOS build complete! Output: dist/finpos/");
