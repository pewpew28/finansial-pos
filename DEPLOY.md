# 🚀 Panduan Deploy FinTrack + FinPOS ke Vercel

## Persiapan: Google Apps Script

### 1. Buat Google Spreadsheet
1. Buka [sheets.google.com](https://sheets.google.com)
2. Buat spreadsheet baru → beri nama **"FinTrack Database"**
3. Copy **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2. Buat Folder Google Drive
1. Buka [drive.google.com](https://drive.google.com)
2. Buat folder baru → beri nama **"FinPOS Images"**
3. Klik kanan folder → **Share** → **Anyone with the link** → **Viewer**
4. Copy **Folder ID** dari URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

### 3. Setup Apps Script
1. Di Google Spreadsheet → **Extensions** → **Apps Script**
2. Hapus semua kode yang ada
3. Copy semua isi file `gas/Code.gs` → Paste
4. Isi 2 variabel di baris paling atas:
   ```javascript
   const SPREADSHEET_ID = "paste-spreadsheet-id-disini";
   const DRIVE_FOLDER_ID = "paste-folder-id-disini";
   ```
5. Klik **Save** (Ctrl+S)
6. Pilih function `testSetup` → Klik **Run**
7. Allow permissions saat diminta

### 4. Deploy GAS sebagai Web App
1. Klik **Deploy** → **New deployment**
2. Klik ikon ⚙️ → pilih **Web app**
3. Isi:
   - Description: `FinTrack API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy** → **Authorize access**
5. Copy **Web App URL** → simpan! (format: `https://script.google.com/macros/s/xxx/exec`)

### 5. Test GAS
Buka URL ini di browser:
```
[GAS_URL]?action=ping
```
Harus muncul: `{"success":true,"message":"FinTrack API is running"}`

---

## Deploy ke Vercel

### ⚠️ PENTING — Cara Setting Vercel

Kedua app menggunakan **repo yang sama** tapi dengan **Build Command dan Output Directory berbeda**.
- Root Directory di Vercel: **`.` (root / kosongkan saja)**
- Vercel akan baca `vercel.json` dari root

### Deploy FinTrack

#### Via Vercel Dashboard (Recommended):
1. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
2. Klik **Add New Project** → Import repo `fintrack-finpos`
3. Setting:

| Field | Value |
|-------|-------|
| Project Name | `fintrack` |
| Framework Preset | `Vite` |
| Root Directory | `.` (biarkan default / root) |
| Build Command | `npm run build:fintrack` |
| Output Directory | `dist/fintrack` |
| Install Command | `npm install` |

4. Klik **Deploy** ✅

#### Via Vercel CLI (Termux):
```bash
cd ~/fintrack

# Copy vercel config untuk fintrack
cp vercel.fintrack.json vercel.json

# Deploy
vercel --prod --name fintrack \
  --build-env VITE_APP=fintrack

# Saat ditanya settings:
# Build Command: npm run build:fintrack
# Output Directory: dist/fintrack
```

---

### Deploy FinPOS

#### Via Vercel Dashboard:
1. Klik **Add New Project** lagi → Import **repo yang sama**
2. Setting:

| Field | Value |
|-------|-------|
| Project Name | `finpos` |
| Framework Preset | `Vite` |
| Root Directory | `.` (biarkan default / root) |
| Build Command | `npm run build:finpos` |
| Output Directory | `dist/finpos` |
| Install Command | `npm install` |

3. Klik **Deploy** ✅

#### Via Vercel CLI (Termux):
```bash
cd ~/fintrack

# Deploy FinPOS
vercel --prod --name finpos
# Saat ditanya:
# Build Command: npm run build:finpos  
# Output Directory: dist/finpos
```

---

## Hasil Deploy

Setelah berhasil, Anda akan mendapat 2 URL:
```
✅ FinTrack → https://fintrack.vercel.app
✅ FinPOS   → https://finpos.vercel.app
```

---

## Konfigurasi App Setelah Deploy

### FinTrack:
1. Buka `https://fintrack.vercel.app`
2. Setup → Langkah terakhir → Paste **GAS URL**

### FinPOS:
1. Buka `https://finpos.vercel.app`
2. Setup Wizard → Langkah 3 → Paste **GAS URL yang sama**

---

## Troubleshooting

### Error: Build failed
```bash
# Test build lokal dulu
cd ~/fintrack
npm run build:fintrack  # Test FinTrack
npm run build:finpos    # Test FinPOS
```

### Error: GAS tidak merespons
- Pastikan deployment GAS sudah **Published** (bukan hanya saved)
- Cek: Who has access = **Anyone** (bukan "Anyone with Google account")
- Test manual: buka `[GAS_URL]?action=ping` di browser

### Error: Halaman blank setelah deploy
- Pastikan Output Directory sudah benar (`dist/fintrack` atau `dist/finpos`)
- Cek `vercel.json` sudah ada rewrites untuk SPA routing
