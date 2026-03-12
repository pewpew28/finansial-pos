import { useState } from 'react';
import {
  ArrowLeft, Receipt, Eye, Save, RotateCcw,
  Store, ShoppingBag, CreditCard, Palette,
  Type, AlignLeft, Minus, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePos, defaultReceiptSettings } from '../context/PosContext';
import { ReceiptSettings } from '../types';
import { createPortal } from 'react-dom';

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Section Collapsible ──────────────────────────────────────────────────────
function Section({
  icon, title, color, children, defaultOpen = true
}: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5"
      >
        <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="flex-1 text-sm font-black text-gray-900 text-left">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-50 divide-y divide-gray-50">{children}</div>}
    </div>
  );
}

// ─── Toggle Row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ─── Select Row ────────────────────────────────────────────────────────────────
function SelectRow<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-sm font-bold text-gray-800 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              value === opt.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Receipt Preview Modal ────────────────────────────────────────────────────
function PreviewModal({ settings, onClose }: { settings: ReceiptSettings; onClose: () => void }) {
  const { store } = usePos();

  const fontClass = settings.fontFamily === 'monospace' ? "font-mono" : "font-sans";
  const fontSizeClass = settings.fontSize === 'small' ? 'text-[10px]' : settings.fontSize === 'large' ? 'text-sm' : 'text-xs';
  const widthClass = settings.paperWidth === '80mm' ? 'max-w-[320px]' : 'max-w-[240px]';

  const divider = () => {
    if (settings.dividerStyle === 'none') return null;
    const style = settings.dividerStyle === 'dashed' ? 'border-dashed' : settings.dividerStyle === 'double' ? 'border-double border-b-4' : 'border-solid';
    return <div className={`border-t ${style} border-gray-400 my-2`} />;
  };

  const sampleItems = [
    { name: 'Nasi Goreng Spesial', qty: 2, price: 25000, discount: 0, note: 'Tidak pedas', sku: 'NGS-001' },
    { name: 'Es Teh Manis', qty: 3, price: 8000, discount: 2000, note: '', sku: 'ETM-002' },
  ];

  const subtotal = sampleItems.reduce((s, i) => s + (i.qty * i.price) - i.discount, 0);
  const discount = 10000;
  const tax = settings.showTax ? Math.round((subtotal - discount) * 0.11) : 0;
  const total = subtotal - discount + tax;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[90dvh] flex flex-col shadow-2xl">
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900">Preview Struk</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">×</button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Tampilan perkiraan struk Anda</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex justify-center">
          {/* Paper simulation */}
          <div
            className={`${widthClass} w-full bg-white shadow-xl border border-gray-200 rounded-lg p-4 ${fontClass} ${fontSizeClass} text-gray-800`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)' }}
          >
            {/* Header */}
            {settings.showLogo && store.logoBase64 && (
              <div className="flex justify-center mb-2">
                <img src={store.logoBase64} alt="logo" className="w-12 h-12 object-cover rounded-lg" />
              </div>
            )}
            {settings.showStoreName && (
              <p className="text-center font-black text-sm text-gray-900">{store.name || 'Nama Toko'}</p>
            )}
            {settings.showAddress && store.address && (
              <p className="text-center text-gray-500 text-[10px] mt-0.5">{store.address}</p>
            )}
            {settings.showPhone && store.phone && (
              <p className="text-center text-gray-500 text-[10px]">Telp: {store.phone}</p>
            )}
            {settings.showHeaderText && store.receiptHeader && (
              <p className="text-center text-gray-500 text-[10px] italic mt-1">{store.receiptHeader}</p>
            )}

            {divider()}

            {/* Info */}
            {settings.showReceiptNumber && (
              <p className="text-center font-bold text-gray-700">INV-20250101-123456</p>
            )}
            {settings.showDate && (
              <p className="text-center text-gray-500">01 Januari 2025, 10:30</p>
            )}
            {settings.showCashierName && (
              <p className="text-center text-gray-500">Kasir: Budi Santoso</p>
            )}
            {settings.showCustomerName && (
              <p className="text-center text-gray-500">Pelanggan: Pak Andi</p>
            )}

            {divider()}

            {/* Items */}
            <div className="space-y-1.5">
              {sampleItems.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <span className="font-bold flex-1 mr-1 leading-tight">{item.name}</span>
                    <span className="font-bold flex-shrink-0">{(item.qty * item.price - item.discount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 pl-2">
                    <span>{item.qty} × {item.price.toLocaleString('id-ID')}{settings.showSku ? ` [${item.sku}]` : ''}</span>
                    {settings.showItemDiscount && item.discount > 0 && (
                      <span className="text-red-400">-{item.discount.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                  {settings.showItemNote && item.note && (
                    <p className="text-gray-400 pl-2 italic">📝 {item.note}</p>
                  )}
                </div>
              ))}
            </div>

            {divider()}

            {/* Totals */}
            <div className="space-y-0.5">
              {settings.showSubtotal && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">{subtotal.toLocaleString('id-ID')}</span>
                </div>
              )}
              {settings.showDiscount && (
                <div className="flex justify-between text-red-500">
                  <span>Diskon</span>
                  <span className="font-bold">-{discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {settings.showTax && (
                <div className="flex justify-between">
                  <span className="text-gray-500">PPN (11%)</span>
                  <span className="font-bold">{tax.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {divider()}

            <div className="flex justify-between items-center">
              <span className="font-black text-base">TOTAL</span>
              <span className="font-black text-base text-emerald-600">{total.toLocaleString('id-ID')}</span>
            </div>

            {divider()}

            {/* Payment */}
            {settings.showPaymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tunai</span>
                <span className="font-bold">{(total + 5000).toLocaleString('id-ID')}</span>
              </div>
            )}
            {settings.showChange && (
              <div className="flex justify-between">
                <span className="text-gray-500">Kembalian</span>
                <span className="font-bold text-blue-600">5.000</span>
              </div>
            )}

            {divider()}

            {/* Footer */}
            {settings.showThankYou && (
              <p className="text-center text-gray-500 italic">
                {store.receiptFooter || 'Terima kasih telah berbelanja!'}
              </p>
            )}
            {settings.showFooterText && (
              <p className="text-center text-gray-400 text-[9px] mt-1">
                Barang yang sudah dibeli tidak dapat dikembalikan
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-violet-500/30"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ReceiptSettingsScreen({ onBack }: { onBack: () => void }) {
  const { receiptSettings, saveReceiptSettings, store } = usePos();
  const [local, setLocal] = useState<ReceiptSettings>({ ...receiptSettings });
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof ReceiptSettings>(key: K, value: ReceiptSettings[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveReceiptSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocal({ ...defaultReceiptSettings });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Kustomisasi Struk</h1>
            <p className="text-xs text-gray-400">Atur tampilan struk sesuai kebutuhan</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold border border-violet-100"
          >
            <Eye size={14} />
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">

        {/* Header Section */}
        <Section icon={<Store size={16} className="text-emerald-600" />} title="Header Toko" color="bg-emerald-100">
          <ToggleRow label="Logo Toko" desc={store.logoBase64 ? 'Logo tersedia' : 'Logo belum diupload'} value={local.showLogo} onChange={v => update('showLogo', v)} />
          <ToggleRow label="Nama Toko" value={local.showStoreName} onChange={v => update('showStoreName', v)} />
          <ToggleRow label="Alamat" value={local.showAddress} onChange={v => update('showAddress', v)} />
          <ToggleRow label="Nomor Telepon" value={local.showPhone} onChange={v => update('showPhone', v)} />
          <ToggleRow label="Teks Header" desc="Custom text di bawah nama toko" value={local.showHeaderText} onChange={v => update('showHeaderText', v)} />
        </Section>

        {/* Transaction Info */}
        <Section icon={<Receipt size={16} className="text-blue-600" />} title="Info Transaksi" color="bg-blue-100">
          <ToggleRow label="Nomor Struk" desc="e.g. INV-20250101-123456" value={local.showReceiptNumber} onChange={v => update('showReceiptNumber', v)} />
          <ToggleRow label="Tanggal & Waktu" value={local.showDate} onChange={v => update('showDate', v)} />
          <ToggleRow label="Nama Kasir" value={local.showCashierName} onChange={v => update('showCashierName', v)} />
          <ToggleRow label="Nama Pelanggan" value={local.showCustomerName} onChange={v => update('showCustomerName', v)} />
        </Section>

        {/* Items */}
        <Section icon={<ShoppingBag size={16} className="text-violet-600" />} title="Detail Item" color="bg-violet-100">
          <ToggleRow label="Kode SKU" desc="Tampilkan SKU di samping nama produk" value={local.showSku} onChange={v => update('showSku', v)} />
          <ToggleRow label="Catatan Item" desc="Catatan spesifik per item" value={local.showItemNote} onChange={v => update('showItemNote', v)} />
          <ToggleRow label="Diskon Per Item" desc="Tampilkan diskon individual" value={local.showItemDiscount} onChange={v => update('showItemDiscount', v)} />
        </Section>

        {/* Payment Summary */}
        <Section icon={<CreditCard size={16} className="text-orange-600" />} title="Ringkasan Pembayaran" color="bg-orange-100">
          <ToggleRow label="Subtotal" value={local.showSubtotal} onChange={v => update('showSubtotal', v)} />
          <ToggleRow label="Diskon" value={local.showDiscount} onChange={v => update('showDiscount', v)} />
          <ToggleRow label="Pajak (PPN)" value={local.showTax} onChange={v => update('showTax', v)} />
          <ToggleRow label="Metode Pembayaran" value={local.showPaymentMethod} onChange={v => update('showPaymentMethod', v)} />
          <ToggleRow label="Kembalian" value={local.showChange} onChange={v => update('showChange', v)} />
        </Section>

        {/* Footer */}
        <Section icon={<AlignLeft size={16} className="text-teal-600" />} title="Footer" color="bg-teal-100">
          <ToggleRow label="Pesan Terima Kasih" desc={`"${store.receiptFooter || 'Terima kasih!'}"` } value={local.showThankYou} onChange={v => update('showThankYou', v)} />
          <ToggleRow label="Teks Footer" desc="Kebijakan retur, dll" value={local.showFooterText} onChange={v => update('showFooterText', v)} />
        </Section>

        {/* Style */}
        <Section icon={<Palette size={16} className="text-pink-600" />} title="Tampilan & Style" color="bg-pink-100" defaultOpen={false}>
          <div className="px-4 py-3 space-y-4">
            <SelectRow
              label="Font"
              value={local.fontFamily}
              options={[
                { value: 'monospace', label: '⌨️ Monospace (Thermal)' },
                { value: 'sans', label: '✏️ Sans-serif (Modern)' },
              ]}
              onChange={v => update('fontFamily', v)}
            />
            <SelectRow
              label="Ukuran Kertas"
              value={local.paperWidth}
              options={[
                { value: '58mm', label: '58mm (Kecil)' },
                { value: '80mm', label: '80mm (Standar)' },
              ]}
              onChange={v => update('paperWidth', v)}
            />
            <SelectRow
              label="Ukuran Font"
              value={local.fontSize}
              options={[
                { value: 'small', label: 'Kecil' },
                { value: 'normal', label: 'Normal' },
                { value: 'large', label: 'Besar' },
              ]}
              onChange={v => update('fontSize', v)}
            />
          </div>
        </Section>

        {/* Divider Style */}
        <Section icon={<Minus size={16} className="text-gray-600" />} title="Garis Pemisah" color="bg-gray-100" defaultOpen={false}>
          <div className="px-4 py-3">
            <SelectRow
              label="Gaya Garis"
              value={local.dividerStyle}
              options={[
                { value: 'dashed', label: '- - - Dashed' },
                { value: 'solid', label: '─── Solid' },
                { value: 'double', label: '═══ Double' },
                { value: 'none', label: 'Tanpa Garis' },
              ]}
              onChange={v => update('dividerStyle', v)}
            />
          </div>
        </Section>

        {/* WhatsApp */}
        <Section icon={<MessageCircle size={16} className="text-green-600" />} title="Kirim via WhatsApp" color="bg-green-100" defaultOpen={false}>
          <ToggleRow
            label="Aktifkan Kirim Struk WA"
            desc="Kirim struk ke nomor pelanggan via Fonnte"
            value={local.waReceiptEnabled}
            onChange={v => update('waReceiptEnabled', v)}
          />
          {local.waReceiptEnabled && (
            <div className="px-4 py-3">
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Nomor Default (opsional)</label>
              <input
                type="tel"
                value={local.waDefaultPhone}
                onChange={e => update('waDefaultPhone', e.target.value)}
                placeholder="628xxx (pre-fill saat checkout)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-400"
              />
              <p className="text-[10px] text-gray-400 mt-1.5">
                Token Fonnte diambil dari pengaturan notifikasi FinTrack
              </p>
            </div>
          )}
        </Section>

        {/* Font */}
        <Section icon={<Type size={16} className="text-indigo-600" />} title="Teks Kustom" color="bg-indigo-100" defaultOpen={false}>
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Teks Header</label>
              <textarea
                value={store.receiptHeader}
                readOnly
                rows={2}
                placeholder="Diatur di Profil Toko"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 outline-none resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Ubah di menu Profil Toko</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Teks Footer</label>
              <textarea
                value={store.receiptFooter}
                readOnly
                rows={2}
                placeholder="Diatur di Profil Toko"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 outline-none resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Ubah di menu Profil Toko</p>
            </div>
          </div>
        </Section>

      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm"
        >
          <RotateCcw size={15} />
          Reset
        </button>
        <button
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm shadow-lg transition-all ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/30'
          }`}
        >
          <Save size={15} />
          {saved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal settings={local} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
