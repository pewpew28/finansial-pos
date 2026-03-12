# 🚀 Panduan Deploy via Termux

## Persiapan Awal (Lakukan 1x saja)

```bash
# Install Vercel CLI
npm install -g vercel

# Login Vercel
vercel login
```

---

## STEP 1 — Extract & Install

```bash
# Akses storage
termux-setup-storage

# Pindah ke folder project
cd ~/storage/downloads
unzip keuangan-personal-app-script.zip -d finansial
cp -r finansial ~/finansial
cd ~/finansial

# Install dependencies
npm install
```

---

## STEP 2 — Push ke GitHub

```bash
# Setup identitas git
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"

# Init repo
git init
git add .
git commit -m "feat: FinTrack + FinPOS initial release"

# Sambungkan ke GitHub (ganti USERNAME & REPO)
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

> Saat diminta password → gunakan GitHub Personal Access Token
> Cara dapat token: github.com → Settings → Developer Settings → Personal Access Tokens → Generate New Token → centang "repo"

---

## STEP 3 — Deploy FinTrack

```bash
cd ~/finansial

# Pastikan vercel.json untuk FinTrack
cp vercel.fintrack.json vercel.json
git add vercel.json
git commit -m "config: fintrack vercel"
git push

# Deploy
vercel --prod
```

Jawab pertanyaan Vercel:
```
? Set up and deploy? → Y
? Which scope? → pilih akun Anda
? Link to existing project? → N
? What's your project name? → fintrack
? In which directory is your code located? → ./
? Want to override settings? → N
```

✅ Catat URL yang diberikan: https://fintrack-xxx.vercel.app

---

## STEP 4 — Deploy FinPOS

```bash
cd ~/finansial

# Ganti vercel.json untuk FinPOS
cp vercel.finpos.json vercel.json
git add vercel.json
git commit -m "config: finpos vercel"
git push

# Deploy sebagai project BARU
vercel --prod
```

Jawab pertanyaan Vercel:
```
? Set up and deploy? → Y
? Which scope? → pilih akun Anda
? Link to existing project? → N
? What's your project name? → finpos
? In which directory is your code located? → ./
? Want to override settings? → N
```

✅ Catat URL yang diberikan: https://finpos-xxx.vercel.app

---

## STEP 5 — Setup Google Apps Script

1. Buka https://sheets.google.com → Buat spreadsheet baru
2. Catat Spreadsheet ID dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. Buat folder di Google Drive bernama "FinPOS Images"
   - Klik kanan folder → Share → Anyone with link → Viewer
   - Catat Folder ID dari URL

4. Di spreadsheet: Extensions → Apps Script
5. Hapus semua kode yang ada
6. Copy-paste semua isi file `gas/Code.gs`
7. Isi 2 variabel di baris pertama:
   ```javascript
   const SPREADSHEET_ID = "paste-spreadsheet-id-disini";
   const DRIVE_FOLDER_ID = "paste-folder-id-disini";
   ```
8. Klik Save (💾)
9. Jalankan fungsi `testSetup` → klik Run
   - Akan muncul popup izin → Allow
   - Tunggu selesai → cek spreadsheet (sheet baru otomatis dibuat)
10. Deploy sebagai Web App:
    - Klik Deploy → New Deployment
    - Type: Web App
    - Execute as: Me
    - Who has access: Anyone
    - Klik Deploy → Copy URL

11. Test di browser: [GAS_URL]?action=ping
    - Harus muncul: {"success":true,"message":"FinTrack & FinPOS API is running"}

---

## STEP 6 — Konfigurasi App

### FinTrack
1. Buka URL FinTrack
2. Setup PIN & nama
3. Settings → GAS URL → paste URL dari Step 5

### FinPOS  
1. Buka URL FinPOS
2. Setup Wizard akan muncul
3. Step 3 → paste GAS URL yang SAMA dengan FinTrack

---

## ✅ Selesai!

Kedua app sudah terhubung ke 1 Google Spreadsheet yang sama.
Setiap transaksi POS akan otomatis sync ke FinTrack sebagai Pemasukan.

---

## 🆘 Troubleshooting

### Error: "Command not found: vercel"
```bash
npm install -g vercel
```

### Error: "EACCES permission denied"
```bash
# Pastikan project ada di home directory, bukan /storage/
cp -r ~/storage/downloads/finansial ~/finansial
cd ~/finansial
```

### Error: Build failed di Vercel
```bash
# Test build lokal dulu
npm run build:fintrack
npm run build:finpos
# Jika error, screenshot dan minta bantuan
```

### Error: Git push rejected
```bash
git push -u origin main --force
```
