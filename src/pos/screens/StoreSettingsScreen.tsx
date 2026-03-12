import { useState, useRef } from 'react';
import {
  ChevronLeft, Store, Phone, MapPin, Link2, Percent,
  Save, Camera, Upload, CheckCircle2, AlertCircle,
  FileText, MessageSquare, Copy, ExternalLink,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { fileToDataUrl, uploadImageToGDrive, fileToBase64, GAS_POS_ADDON } from '../utils/gas';
import toast from 'react-hot-toast';

export default function StoreSettingsScreen({ onBack }: { onBack: () => void }) {
  const { store, saveStore } = usePos();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: store.name,
    address: store.address,
    phone: store.phone,
    receiptHeader: store.receiptHeader,
    receiptFooter: store.receiptFooter,
    gasUrl: store.gasUrl,
    taxEnabled: store.taxEnabled,
    taxPercent: store.taxPercent,
    fonntToken: store.fonntToken,
    fonntPhone: store.fonntPhone,
    logoBase64: store.logoBase64,
    logoUrl: store.logoUrl,
  });

  const [uploading, setUploading] = useState(false);
  const [gasStatus, setGasStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [showGasCode, setShowGasCode] = useState(false);
  const [activeSection, setActiveSection] = useState<'store' | 'gas' | 'tax' | 'fonnte'>('store');

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm(f => ({ ...f, logoBase64: dataUrl }));

    // Upload to Google Drive if GAS URL is set
    if (form.gasUrl) {
      try {
        setUploading(true);
        const base64 = await fileToBase64(file);
        const url = await uploadImageToGDrive(form.gasUrl, base64, `store_logo_${Date.now()}.jpg`);
        setForm(f => ({ ...f, logoUrl: url }));
        toast.success('Logo berhasil diupload ke Google Drive!');
      } catch {
        toast.error('Upload ke Drive gagal. Logo disimpan lokal.');
      } finally {
        setUploading(false);
      }
    }
  };

  const testGasConnection = async () => {
    if (!form.gasUrl) {
      toast.error('Masukkan URL GAS terlebih dahulu');
      return;
    }
    setGasStatus('testing');
    try {
      await fetch(form.gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      setGasStatus('ok');
      toast.success('Koneksi GAS berhasil!');
    } catch {
      setGasStatus('error');
      toast.error('Koneksi GAS gagal');
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Nama toko wajib diisi');
      return;
    }
    saveStore(form);
    toast.success('Pengaturan toko disimpan!');
    onBack();
  };

  const SECTIONS = [
    { id: 'store', label: 'Toko' },
    { id: 'gas', label: 'GAS' },
    { id: 'tax', label: 'Pajak' },
    { id: 'fonnte', label: 'Fonnte' },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Pengaturan Toko</h1>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95"
          >
            <Save size={14} />
            Simpan
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === s.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">

        {/* ── STORE INFO ──────────────────────────────────────────────────── */}
        {activeSection === 'store' && (
          <>
            {/* Logo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Logo Toko</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                  {form.logoBase64 ? (
                    <img src={form.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={28} className="text-gray-300" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-bold rounded-xl active:scale-95 transition-all"
                  >
                    <Camera size={15} />
                    Pilih Foto
                  </button>
                  {form.logoUrl && (
                    <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2">
                      <Upload size={12} className="text-blue-500 flex-shrink-0" />
                      <p className="text-[10px] text-blue-600 font-semibold truncate">Tersimpan di Drive</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">Logo akan diupload ke Google Drive otomatis jika GAS URL sudah diset</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Info fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 pt-4 mb-3">Informasi Toko</p>
              {[
                { icon: <Store size={16} className="text-emerald-500" />, label: 'Nama Toko *', key: 'name', placeholder: 'e.g. Toko Maju Jaya', required: true },
                { icon: <MapPin size={16} className="text-blue-500" />, label: 'Alamat', key: 'address', placeholder: 'Jl. Sudirman No. 1, Jakarta' },
                { icon: <Phone size={16} className="text-violet-500" />, label: 'Nomor Telepon', key: 'phone', placeholder: '08xxxxxxxxxx' },
              ].map(field => (
                <div key={field.key} className="flex items-start gap-3 px-4 py-3 border-t border-gray-50">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    {field.icon}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</label>
                    <input
                      type="text"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full text-sm text-gray-800 bg-transparent outline-none mt-0.5 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt texts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 pt-4 mb-3">Teks Struk</p>
              {[
                { icon: <FileText size={16} className="text-orange-500" />, label: 'Header Struk', key: 'receiptHeader', placeholder: 'e.g. Selamat datang di toko kami!' },
                { icon: <MessageSquare size={16} className="text-pink-500" />, label: 'Footer Struk', key: 'receiptFooter', placeholder: 'e.g. Terima kasih telah berbelanja!' },
              ].map(field => (
                <div key={field.key} className="flex items-start gap-3 px-4 py-3 border-t border-gray-50">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    {field.icon}
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</label>
                    <input
                      type="text"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full text-sm text-gray-800 bg-transparent outline-none mt-0.5 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── GAS ─────────────────────────────────────────────────────────── */}
        {activeSection === 'gas' && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 size={16} className="text-blue-600" />
                <p className="text-sm font-black text-blue-800">Google Apps Script</p>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                FinPOS menggunakan GAS yang <strong>sama</strong> dengan FinTrack. Data penjualan POS akan otomatis tersinkronisasi ke Google Sheets.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-3">URL Google Apps Script</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.gasUrl}
                  onChange={e => setForm(f => ({ ...f, gasUrl: e.target.value }))}
                  placeholder="https://script.google.com/macros/s/..."
                  className="flex-1 text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5 outline-none border border-gray-200"
                />
                <button
                  onClick={testGasConnection}
                  disabled={gasStatus === 'testing'}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                    gasStatus === 'ok' ? 'bg-emerald-100 text-emerald-600' :
                    gasStatus === 'error' ? 'bg-red-100 text-red-500' :
                    'bg-blue-500 text-white'
                  }`}
                >
                  {gasStatus === 'testing' ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : gasStatus === 'ok' ? (
                    <CheckCircle2 size={15} />
                  ) : gasStatus === 'error' ? (
                    <AlertCircle size={15} />
                  ) : (
                    'Test'
                  )}
                </button>
              </div>
              {gasStatus === 'ok' && <p className="text-xs text-emerald-600 font-bold mt-2">✓ Koneksi berhasil!</p>}
              {gasStatus === 'error' && <p className="text-xs text-red-500 font-bold mt-2">✗ Koneksi gagal. Periksa URL.</p>}
            </div>

            {/* GAS Code */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowGasCode(!showGasCode)}
                className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-900">Kode GAS untuk POS</p>
                  <p className="text-xs text-gray-400">Tambahkan ke Apps Script yang sudah ada</p>
                </div>
                <ChevronLeft size={16} className={`text-gray-300 transition-transform ${showGasCode ? '-rotate-90' : 'rotate-180'}`} />
              </button>

              {showGasCode && (
                <div className="border-t border-gray-100">
                  <div className="flex gap-2 px-4 py-3 border-b border-gray-100">
                    <button
                      onClick={() => { navigator.clipboard?.writeText(GAS_POS_ADDON); toast.success('Kode disalin!'); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      <Copy size={12} /> Salin Kode
                    </button>
                    <a
                      href="https://script.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                      <ExternalLink size={12} /> Buka GAS
                    </a>
                  </div>
                  <div className="bg-gray-900 p-4 overflow-x-auto">
                    <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {GAS_POS_ADDON}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Cara setup */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-black text-amber-700 mb-2">📋 Cara Setup GAS POS:</p>
              <ol className="text-xs text-amber-700 space-y-1.5 list-none">
                {[
                  'Buka Google Apps Script (script.google.com)',
                  'Pilih project FinTrack yang sudah ada',
                  'Tambahkan kode GAS POS ke akhir file',
                  'Ubah YOUR_FOLDER_ID dengan ID folder Google Drive untuk foto produk',
                  'Simpan dan deploy ulang sebagai Web App',
                  'Copy URL baru dan paste di field URL di atas',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[9px] font-black text-amber-800 flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* ── TAX ─────────────────────────────────────────────────────────── */}
        {activeSection === 'tax' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Percent size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Pengaturan Pajak / PPN</p>
                <p className="text-xs text-gray-400">Aktifkan jika toko terkena PPN</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">Aktifkan Pajak (PPN)</p>
                <p className="text-xs text-gray-400 mt-0.5">Pajak akan ditambahkan ke setiap transaksi</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, taxEnabled: !f.taxEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.taxEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.taxEnabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {form.taxEnabled && (
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                <label className="text-[10px] font-black text-violet-400 uppercase tracking-wider block mb-2">Persentase Pajak (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.taxPercent}
                    onChange={e => setForm(f => ({ ...f, taxPercent: Number(e.target.value) }))}
                    min="0"
                    max="100"
                    className="flex-1 text-2xl font-black text-violet-700 bg-transparent outline-none"
                  />
                  <span className="text-2xl font-black text-violet-400">%</span>
                </div>
                <p className="text-xs text-violet-500 mt-2">
                  PPN Indonesia = 11% (berlaku per April 2022)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── FONNTE ──────────────────────────────────────────────────────── */}
        {activeSection === 'fonnte' && (
          <>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <p className="text-sm font-black text-green-800">Notifikasi WhatsApp via Fonnte</p>
              </div>
              <p className="text-xs text-green-700 leading-relaxed">
                Kirim struk ke pelanggan, laporan penjualan harian, dan alert stok kritis langsung via WhatsApp.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[
                { icon: '🔑', label: 'Fonnte Token', key: 'fonntToken', placeholder: 'Token dari halaman device Fonnte', type: 'text' },
                { icon: '📱', label: 'Nomor WA Owner', key: 'fonntPhone', placeholder: '628xxxxxxxxxx (format internasional)', type: 'tel' },
              ].map(field => (
                <div key={field.key} className="flex items-start gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
                  <span className="text-xl mt-0.5">{field.icon}</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full text-sm text-gray-800 bg-transparent outline-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-black text-amber-700 mb-2">💡 Cara dapat Token Fonnte:</p>
              <ol className="text-xs text-amber-700 space-y-1.5">
                {[
                  'Daftar di fonnte.com',
                  'Klik "Connect Device" dan scan QR dengan WA',
                  'Setelah terhubung, klik nama device',
                  'Salin Token dan paste di field di atas',
                  '1.000 pesan gratis/bulan untuk akun baru',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[9px] font-black text-amber-800 flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
