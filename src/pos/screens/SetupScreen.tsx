import { useState, useRef } from 'react';
import {
  Store, MapPin, Phone, Link2, User, ChevronRight,
  ChevronLeft, Check, Upload, Eye, EyeOff, Sparkles, ShieldCheck,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { SetupStep, PosRole } from '../types';
import { fileToDataUrl } from '../utils/gas';
import toast from 'react-hot-toast';

const STEPS: SetupStep[] = ['store', 'logo', 'gas', 'owner', 'done'];

const AVATAR_EMOJIS = ['👤','👨','👩','🧑','👨‍💼','👩‍💼','🧑‍💼','😊','🤵','👸'];

export default function SetupScreen() {
  const { saveStore, addCashier, store } = usePos();
  const [step, setStep] = useState<SetupStep>('store');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Store form
  const [storeName, setStoreName] = useState(store.name || '');
  const [storeAddress, setStoreAddress] = useState(store.address || '');
  const [storePhone, setStorePhone] = useState(store.phone || '');
  const [receiptFooter, setReceiptFooter] = useState(store.receiptFooter || 'Terima kasih telah berbelanja!');

  // GAS form
  const [gasUrl, setGasUrl] = useState(store.gasUrl || '');

  // Owner form
  const [ownerName, setOwnerName] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerPin2, setOwnerPin2] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [ownerAvatar, setOwnerAvatar] = useState('👨‍💼');

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran file max 2MB'); return; }
    const dataUrl = await fileToDataUrl(file);
    setLogoPreview(dataUrl);
    setLogoBase64(dataUrl);
    toast.success('Logo siap digunakan');
  };

  const handleStoreNext = () => {
    if (!storeName.trim()) { toast.error('Nama toko wajib diisi'); return; }
    saveStore({ name: storeName, address: storeAddress, phone: storePhone, receiptFooter });
    goNext();
  };

  const handleLogoNext = () => {
    if (logoBase64) saveStore({ logoBase64, logoUrl: logoBase64 });
    goNext();
  };

  const handleGasNext = () => {
    saveStore({ gasUrl });
    goNext();
  };

  const handleOwnerNext = () => {
    if (!ownerName.trim()) { toast.error('Nama owner wajib diisi'); return; }
    if (ownerPin.length < 6) { toast.error('PIN harus 6 digit'); return; }
    if (ownerPin !== ownerPin2) { toast.error('Konfirmasi PIN tidak cocok'); return; }
    addCashier({
      name: ownerName,
      pin: ownerPin,
      role: 'owner' as PosRole,
      avatarEmoji: ownerAvatar,
      isActive: true,
    });
    goNext();
  };

  const handleFinish = () => {
    saveStore({ isSetup: true });
    toast.success('Setup selesai! Selamat datang di FinPOS 🎉');
  };

  const progressWidth = ((stepIndex) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex flex-col items-center justify-center p-5">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <Store size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Setup FinPOS</h1>
          <p className="text-xs text-gray-400 mt-1">
            Langkah {stepIndex + 1} dari {STEPS.length}
          </p>
        </div>

        <div className="px-6 pb-6">
          {/* ── STEP 1: Store Info ─────────────────────────────────────────── */}
          {step === 'store' && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <p className="text-sm font-semibold text-gray-600">Informasi Toko</p>
                <p className="text-xs text-gray-400 mt-1">Isi profil toko Anda</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nama Toko *</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                    <Store size={16} className="text-gray-400" />
                    <input
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="Contoh: Toko Berkah Jaya"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Alamat</label>
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <textarea
                      value={storeAddress}
                      onChange={e => setStoreAddress(e.target.value)}
                      placeholder="Jl. Contoh No. 1, Kota"
                      rows={2}
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nomor Telepon</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      value={storePhone}
                      onChange={e => setStorePhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      type="tel"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Pesan Footer Struk</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                    <span className="text-gray-400 text-sm">💬</span>
                    <input
                      value={receiptFooter}
                      onChange={e => setReceiptFooter(e.target.value)}
                      placeholder="Terima kasih telah berbelanja!"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStoreNext}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
              >
                Lanjut <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Logo ───────────────────────────────────────────────── */}
          {step === 'logo' && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <p className="text-sm font-semibold text-gray-600">Logo Toko</p>
                <p className="text-xs text-gray-400 mt-1">Upload logo untuk struk & tampilan</p>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className={`relative aspect-square max-w-[200px] mx-auto rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  logoPreview
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-bold">Ganti Logo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Upload size={22} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Upload Logo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, max 2MB</p>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

              {logoPreview && (
                <div className="flex items-center gap-2 justify-center text-emerald-600 text-sm font-semibold">
                  <Check size={16} /> Logo siap
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                💡 Logo akan diunggah ke Google Drive saat pertama kali terhubung ke GAS
              </p>

              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <ChevronLeft size={18} /> Kembali
                </button>
                <button onClick={handleLogoNext} className="flex-2 flex-grow py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all">
                  {logoPreview ? 'Lanjut' : 'Lewati'} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: GAS URL ────────────────────────────────────────────── */}
          {step === 'gas' && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <p className="text-sm font-semibold text-gray-600">Koneksi Backend</p>
                <p className="text-xs text-gray-400 mt-1">Hubungkan ke Google Apps Script</p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Link2 size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Gunakan GAS yang sama</p>
                    <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                      Jika Anda sudah menggunakan FinTrack, masukkan URL GAS yang sama.
                      Data POS akan otomatis tersinkron dengan keuangan.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">URL Google Apps Script</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <Link2 size={16} className="text-gray-400" />
                  <input
                    value={gasUrl}
                    onChange={e => setGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-2">📋 Yang perlu ditambahkan ke GAS:</p>
                <ul className="text-xs text-amber-600 space-y-1">
                  <li>• Fungsi <code className="bg-amber-100 px-1 rounded">handleUploadImage</code> untuk upload foto ke Drive</li>
                  <li>• Sheet: POS_Products, POS_Sales, POS_StockHistory</li>
                  <li>• Lihat panduan lengkap di menu Settings POS</li>
                </ul>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <ChevronLeft size={18} /> Kembali
                </button>
                <button onClick={handleGasNext} className="flex-2 flex-grow py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all">
                  {gasUrl ? 'Lanjut' : 'Lewati'} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Owner ──────────────────────────────────────────────── */}
          {step === 'owner' && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <p className="text-sm font-semibold text-gray-600">Akun Owner</p>
                <p className="text-xs text-gray-400 mt-1">Buat akun pemilik toko</p>
              </div>

              {/* Avatar picker */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Pilih Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setOwnerAvatar(e)}
                      className={`w-10 h-10 text-2xl rounded-xl transition-all active:scale-90 ${
                        ownerAvatar === e
                          ? 'bg-emerald-100 ring-2 ring-emerald-500'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nama Owner *</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <User size={16} className="text-gray-400" />
                  <input
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">PIN (6 digit) *</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <input
                    value={ownerPin}
                    onChange={e => setOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="● ● ● ● ● ●"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 tracking-widest"
                  />
                  <button onClick={() => setShowPin(s => !s)} className="text-gray-400">
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Konfirmasi PIN *</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <input
                    value={ownerPin2}
                    onChange={e => setOwnerPin2(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="● ● ● ● ● ●"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400 tracking-widest"
                  />
                </div>
                {ownerPin2 && ownerPin !== ownerPin2 && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 ml-1">PIN tidak cocok</p>
                )}
              </div>

              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">
                  🔐 Owner memiliki akses penuh ke semua fitur termasuk manajemen kasir dan laporan keuangan
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <ChevronLeft size={18} /> Kembali
                </button>
                <button onClick={handleOwnerNext} className="flex-2 flex-grow py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all">
                  Buat Akun <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Done ───────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="space-y-6 text-center py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/40">
                  <Sparkles size={36} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Setup Selesai!</h2>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    FinPOS siap digunakan.<br />
                    Selamat berjualan, <span className="font-bold text-emerald-600">{storeName}</span>!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: '🏪', label: 'Toko', value: storeName },
                  { icon: '📍', label: 'Alamat', value: storeAddress || '-' },
                  { icon: '📱', label: 'Telepon', value: storePhone || '-' },
                  { icon: '🔗', label: 'Backend', value: gasUrl ? 'Terhubung' : 'Manual' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-xs text-gray-400">{item.icon} {item.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-base rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/40 active:scale-[0.98] transition-all"
              >
                <Store size={20} />
                Mulai Gunakan FinPOS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mt-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-full transition-all duration-300 ${
              i <= stepIndex
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
