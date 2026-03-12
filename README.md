# 💰 FinTrack + 🏪 FinPOS

Aplikasi manajemen keuangan pribadi dan point of sale yang terintegrasi.

## 🚀 Quick Deploy

Lihat **[DEPLOY.md](./DEPLOY.md)** untuk panduan lengkap deploy ke Vercel.

### Ringkasan:

| App | Root Directory di Vercel | URL |
|-----|--------------------------|-----|
| FinTrack | `apps/fintrack` | https://fintrack.vercel.app |
| FinPOS | `apps/finpos` | https://finpos.vercel.app |

Backend: Google Apps Script (`gas/Code.gs`)

## 🛠️ Development Lokal

```bash
# Install dependencies
npm install

# Jalankan FinTrack (dev mode)
npm run dev

# Build FinTrack
npx vite build --config vite.fintrack.config.ts

# Build FinPOS
npx vite build --config vite.finpos.config.ts
```

## 📁 Struktur Project

```
├── apps/fintrack/    → Deploy config FinTrack (Vercel root dir)
├── apps/finpos/      → Deploy config FinPOS (Vercel root dir)
├── src/              → Source code (shared)
├── gas/Code.gs       → Google Apps Script backend
└── DEPLOY.md         → Panduan deploy lengkap
```
