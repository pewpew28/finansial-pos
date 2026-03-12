# 🚀 Panduan Deploy via Termux

## Persiapan Awal (Lakukan 1x)

```bash
# Install tools
pkg install git nodejs-lts -y
npm install -g vercel

# Izinkan akses storage
termux-setup-storage
```

---

## STEP 1 — Extract & Setup Project

```bash
# Pindah ke home (WAJIB, jangan di /storage/)
cd ~
rm -rf finansial

# Copy dari downloads
cp -r ~/storage/downloads/nama-folder ~/finansial
cd ~/finansial

# Install dependencies
npm install
```

---

## STEP 2 — Test Build Lokal

```bash
# Test FinTrack
npm run build:fintrack
# Harus ada: dist/fintrack/index.html ✅

# Test FinPOS
npm run build:finpos
# Harus ada: dist/finpos/index.html ✅
```

---

## STEP 3 — Push ke GitHub

```bash
# Setup identity (ganti dengan data Anda)
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"

# Init repo
git init
git add .
git commit -m "feat: FinTrack + FinPOS"

# Sambungkan ke GitHub (ganti URL)
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
# Username: username GitHub
# Password: Personal Access Token (bukan password!)
```

---

## STEP 4 — Deploy FinTrack

```bash
cd ~/finansial

# Hapus .vercel folder jika ada
rm -rf .vercel

# Copy config FinTrack
cp vercel.fintrack.json vercel.json

# Deploy
vercel --prod
```

Jawab pertanyaan Vercel:
```
? Set up and deploy? → Y
? Which scope? → pilih akun Anda
? Link to existing project? → N  ← PENTING: pilih N
? What's your project's name? → fintrack
? In which directory is your code located? → ./
? Want to override settings? → Y
  Build Command: npm run build:fintrack
  Output Directory: dist/fintrack
  Development Command: (kosongkan, enter)
```

---

## STEP 5 — Deploy FinPOS

```bash
cd ~/finansial

# WAJIB: Hapus .vercel folder dari project sebelumnya
rm -rf .vercel

# Copy config FinPOS
cp vercel.finpos.json vercel.json

# Deploy
vercel --prod
```

Jawab pertanyaan Vercel:
```
? Set up and deploy? → Y
? Which scope? → pilih akun Anda
? Link to existing project? → N  ← PENTING: pilih N
? What's your project's name? → finpos
? In which directory is your code located? → ./
? Want to override settings? → Y
  Build Command: npm run build:finpos
  Output Directory: dist/finpos
  Development Command: (kosongkan, enter)
```

---

## ⚠️ Troubleshooting

### Problem: `vercel --prod` tidak tanya project baru
**Penyebab**: Ada folder `.vercel` dari deploy sebelumnya
**Fix**:
```bash
rm -rf .vercel
vercel --prod
```

### Problem: 404 di FinPOS
**Penyebab**: Output directory salah
**Fix**: Pastikan saat deploy pilih **Override Settings → Y** dan isi:
- Output Directory: `dist/finpos`

### Problem: Build error di Vercel
**Fix**: 
```bash
# Test build lokal dulu
npm run build:finpos
# Jika error, paste pesan errornya
```

### Problem: git push minta password
**Fix**: Gunakan Personal Access Token dari:
GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token
Centang: repo ✅

---

## ✅ Hasil Akhir

Setelah deploy berhasil:
```
FinTrack → https://fintrack.vercel.app
FinPOS   → https://finpos.vercel.app
```

Kedua app menggunakan **GAS URL yang sama** untuk integrasi data!
