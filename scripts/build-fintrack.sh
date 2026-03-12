#!/bin/bash
# Build FinTrack untuk deploy ke Vercel
echo "🏗️  Building FinTrack..."
npx vite build --config vite.fintrack.config.ts
echo "✅ FinTrack build selesai → dist/fintrack/"
