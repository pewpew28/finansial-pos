#!/bin/bash
# Build FinPOS untuk deploy ke Vercel
echo "🏗️  Building FinPOS..."
npx vite build --config vite.finpos.config.ts
echo "✅ FinPOS build selesai → dist/finpos/"
