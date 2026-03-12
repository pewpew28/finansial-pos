import { useState, useMemo } from 'react';
import {
  ArrowLeft, Package, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Minus, ClipboardList, History, RefreshCw, Search,
  ChevronRight, X, CheckCircle2, ArrowUpCircle,
  ShoppingCart, Wrench, RotateCcw, Zap,
  BarChart3, Calendar, ChevronDown,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { StockHistory, PosProduct, StockMoveType } from '../types';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const MOVE_TYPE_CONFIG: Record<StockMoveType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  sale:       { label: 'Penjualan',  color: 'text-red-600',    bg: 'bg-red-50',    icon: <ShoppingCart size={14} className="text-red-500" /> },
  restock:    { label: 'Restock',    color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ArrowUpCircle size={14} className="text-emerald-500" /> },
  adjustment: { label: 'Penyesuaian', color: 'text-blue-600',   bg: 'bg-blue-50',   icon: <Wrench size={14} className="text-blue-500" /> },
  damage:     { label: 'Rusak/Hilang', color: 'text-orange-600', bg: 'bg-orange-50', icon: <AlertTriangle size={14} className="text-orange-500" /> },
  return:     { label: 'Retur',      color: 'text-purple-600',  bg: 'bg-purple-50', icon: <RotateCcw size={14} className="text-purple-500" /> },
};

// ─── Restock Modal ────────────────────────────────────────────────────────────
function RestockModal({
  product,
  onClose,
  onConfirm,
}: {
  product: PosProduct;
  onClose: () => void;
  onConfirm: (qty: number, costPrice: number, note: string) => void;
}) {
  const [qty, setQty]         = useState('');
  const [cost, setCost]       = useState(product.costPrice ? String(product.costPrice) : '');
  const [note, setNote]       = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!qty || Number(qty) <= 0) e.qty = 'Jumlah harus lebih dari 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(Number(qty), Number(cost) || 0, note);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <ArrowUpCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Tambah Stok</h2>
              <p className="text-xs text-gray-500 font-medium">Restock · {product.name}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current stock */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold text-gray-600">Stok Saat Ini</span>
            <span className="text-lg font-black text-gray-900">{product.stock} {product.unit}</span>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Tambah *</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(v => String(Math.max(1, Number(v) - 1)))}
                className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-600 active:scale-90 transition-all text-lg"
              >−</button>
              <input
                type="number"
                value={qty}
                onChange={e => { setQty(e.target.value); setErrors({}); }}
                placeholder="0"
                className={`flex-1 text-center text-2xl font-black py-2.5 rounded-2xl border-2 outline-none bg-white transition-colors ${
                  errors.qty ? 'border-red-300' : 'border-gray-200 focus:border-emerald-400'
                }`}
              />
              <button
                onClick={() => setQty(v => String(Number(v || 0) + 1))}
                className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-white active:scale-90 transition-all text-lg shadow-md shadow-emerald-500/30"
              >+</button>
            </div>
            {errors.qty && <p className="text-xs text-red-500 font-semibold mt-1.5">{errors.qty}</p>}
            {qty && Number(qty) > 0 && (
              <p className="text-xs text-emerald-600 font-bold mt-1.5 text-center">
                Stok setelah restock: {product.stock + Number(qty)} {product.unit}
              </p>
            )}
          </div>

          {/* Cost price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Modal / {product.unit} (Opsional)</label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-emerald-400 px-4 py-3 transition-colors">
              <span className="text-sm font-bold text-gray-400">Rp</span>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-base font-bold text-gray-900 outline-none"
              />
            </div>
            {cost && qty && Number(cost) > 0 && Number(qty) > 0 && (
              <p className="text-xs text-blue-600 font-bold mt-1.5">
                Total modal: {fmt(Number(cost) * Number(qty))}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nama supplier, nomor PO, dll..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm font-semibold bg-gray-50 transition-colors"
            />
          </div>
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpCircle size={16} />
            Tambah Stok
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Adjustment Modal ─────────────────────────────────────────────────────────
function AdjustmentModal({
  product,
  onClose,
  onConfirm,
}: {
  product: PosProduct;
  onClose: () => void;
  onConfirm: (qty: number, type: StockMoveType, note: string) => void;
}) {
  const [qty, setQty]         = useState('');
  const [mode, setMode]       = useState<'add' | 'subtract'>('subtract');
  const [type, setType]       = useState<StockMoveType>('adjustment');
  const [note, setNote]       = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const adjTypes: { key: StockMoveType; label: string; emoji: string; mode: 'add' | 'subtract' }[] = [
    { key: 'adjustment', label: 'Koreksi Stok', emoji: '🔧', mode: 'subtract' },
    { key: 'damage',     label: 'Rusak/Hilang', emoji: '⚠️', mode: 'subtract' },
    { key: 'return',     label: 'Retur Masuk',  emoji: '↩️', mode: 'add' },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!qty || Number(qty) <= 0) e.qty = 'Jumlah harus lebih dari 0';
    if (mode === 'subtract' && Number(qty) > product.stock) e.qty = `Stok hanya ada ${product.stock} ${product.unit}`;
    if (!note.trim()) e.note = 'Catatan wajib diisi untuk penyesuaian';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const finalQty = mode === 'subtract' ? -Number(qty) : Number(qty);
    onConfirm(finalQty, type, note);
    onClose();
  };

  const finalStock = product.stock + (mode === 'subtract' ? -Number(qty || 0) : Number(qty || 0));

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Wrench size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Penyesuaian Stok</h2>
              <p className="text-xs text-gray-500 font-medium">{product.name}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Current stock */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold text-gray-600">Stok Saat Ini</span>
            <span className="text-lg font-black text-gray-900">{product.stock} {product.unit}</span>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jenis Penyesuaian</label>
            <div className="grid grid-cols-3 gap-2">
              {adjTypes.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setType(t.key); setMode(t.mode); }}
                  className={`py-3 px-2 rounded-2xl text-center transition-all border-2 ${
                    type === t.key
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-xl mb-1">{t.emoji}</div>
                  <p className={`text-[10px] font-bold leading-tight ${type === t.key ? 'text-violet-700' : 'text-gray-500'}`}>
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setMode('subtract')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'subtract' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <Minus size={14} /> Kurangi
            </button>
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'add' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <Plus size={14} /> Tambah
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah *</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(v => String(Math.max(1, Number(v) - 1)))}
                className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-600 active:scale-90 transition-all text-lg"
              >−</button>
              <input
                type="number"
                value={qty}
                onChange={e => { setQty(e.target.value); setErrors({}); }}
                placeholder="0"
                className={`flex-1 text-center text-2xl font-black py-2.5 rounded-2xl border-2 outline-none bg-white transition-colors ${
                  errors.qty ? 'border-red-300' : 'border-gray-200 focus:border-violet-400'
                }`}
              />
              <button
                onClick={() => setQty(v => String(Number(v || 0) + 1))}
                className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center font-black text-white active:scale-90 transition-all text-lg shadow-md"
              >+</button>
            </div>
            {errors.qty && <p className="text-xs text-red-500 font-semibold mt-1.5">{errors.qty}</p>}
            {qty && Number(qty) > 0 && (
              <div className={`mt-2 text-center text-sm font-bold rounded-xl py-2 ${
                finalStock < 0 ? 'bg-red-50 text-red-600' : finalStock <= product.minStock ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                Stok setelah: {Math.max(0, finalStock)} {product.unit}
                {finalStock < 0 && ' ⚠️ Melebihi stok!'}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alasan / Catatan *</label>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setErrors(v => ({ ...v, note: '' })); }}
              placeholder="Jelaskan alasan penyesuaian stok..."
              rows={2}
              className={`w-full px-4 py-3 rounded-2xl border-2 outline-none text-sm font-semibold bg-gray-50 resize-none transition-colors ${
                errors.note ? 'border-red-300' : 'border-gray-200 focus:border-violet-400'
              }`}
            />
            {errors.note && <p className="text-xs text-red-500 font-semibold mt-1">{errors.note}</p>}
          </div>
        </div>

        <div className="px-5 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Simpan Penyesuaian
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Stock Opname Modal ───────────────────────────────────────────────────────
function OpnameModal({
  products,
  onClose,
  onConfirm,
}: {
  products: PosProduct[];
  onClose: () => void;
  onConfirm: (items: { productId: string; actualStock: number; note: string }[]) => void;
}) {
  const activeProducts = products.filter(p => p.isActive);
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [notes, setNotes]     = useState<Record<string, string>>({});
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(false);

  const filtered = activeProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    const items = Object.entries(actuals)
      .filter(([, v]) => v !== '' && !isNaN(Number(v)))
      .map(([productId, val]) => ({
        productId,
        actualStock: Number(val),
        note: notes[productId] || 'Stok Opname',
      }));

    if (items.length === 0) {
      toast.error('Isi minimal 1 stok aktual');
      return;
    }

    setSaving(true);
    await onConfirm(items);
    setSaving(false);
    onClose();
  };

  const filledCount = Object.values(actuals).filter(v => v !== '').length;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '94dvh' }}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-gray-900">Stok Opname</h2>
              <p className="text-xs text-gray-500 font-medium">Input stok aktual di lapangan</p>
            </div>
            <div className="bg-violet-100 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-black text-violet-700">{filledCount}/{activeProducts.length}</span>
            </div>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
            <Search size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((product, i) => {
            const actual = actuals[product.id] ?? '';
            const diff = actual !== '' ? Number(actual) - product.stock : null;
            const isOutOfStock = product.stock === 0;
            const isLowStock   = product.stock > 0 && product.stock <= product.minStock;

            return (
              <div key={product.id} className={`px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  {/* Product image */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {(product.imageUrl || product.imageBase64) ? (
                      <img src={product.imageUrl || product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-gray-400'}`}>
                        Sistem: {product.stock} {product.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={actual}
                      onChange={e => setActuals(v => ({ ...v, [product.id]: e.target.value }))}
                      placeholder={`Aktual (${product.unit})`}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm font-bold bg-gray-50 transition-colors"
                    />
                  </div>
                  {diff !== null && (
                    <div className={`px-3 py-2.5 rounded-xl text-sm font-black flex-shrink-0 min-w-[60px] text-center ${
                      diff > 0 ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  )}
                </div>

                {diff !== null && diff !== 0 && (
                  <input
                    type="text"
                    value={notes[product.id] ?? ''}
                    onChange={e => setNotes(v => ({ ...v, [product.id]: e.target.value }))}
                    placeholder="Catatan selisih (opsional)..."
                    className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-violet-300 outline-none text-xs font-semibold bg-white transition-colors"
                  />
                )}
              </div>
            );
          })}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex-shrink-0 space-y-3">
          {filledCount > 0 && (
            <div className="bg-violet-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-violet-700">Produk diperbarui</span>
              <span className="text-lg font-black text-violet-700">{filledCount}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all">
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || filledCount === 0}
              className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ClipboardList size={16} />
              {saving ? 'Memproses...' : `Simpan ${filledCount} Produk`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Stock History Item ───────────────────────────────────────────────────────
function HistoryItem({ item }: { item: StockHistory }) {
  const cfg = MOVE_TYPE_CONFIG[item.type];
  const isIn = item.quantity > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
          <span className={`text-sm font-black ml-2 flex-shrink-0 ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
            {isIn ? '+' : ''}{item.quantity} unit
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {item.reference && (
              <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">{item.reference}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{item.stockBefore} → {item.stockAfter}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">{fmtDateTime(item.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── Low Stock Card ───────────────────────────────────────────────────────────
function LowStockCard({
  product,
  onRestock,
}: {
  product: PosProduct;
  onRestock: () => void;
}) {
  const isOut = product.stock === 0;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
      isOut ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white">
        {(product.imageUrl || product.imageBase64) ? (
          <img src={product.imageUrl || product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={20} className={isOut ? 'text-red-400' : 'text-amber-400'} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
        <p className={`text-xs font-bold ${isOut ? 'text-red-600' : 'text-amber-600'}`}>
          {isOut ? '⚠ Stok Habis!' : `⚡ Sisa ${product.stock} ${product.unit}`}
        </p>
        <p className="text-[10px] text-gray-400">Min. stok: {product.minStock} {product.unit}</p>
      </div>
      <button
        onClick={onRestock}
        className={`px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1 ${
          isOut ? 'bg-red-500 text-white shadow-sm shadow-red-500/30' : 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
        }`}
      >
        <Plus size={12} />
        Restock
      </button>
    </div>
  );
}

// ─── Main StockScreen ─────────────────────────────────────────────────────────
type Tab = 'overview' | 'history' | 'opname';

export default function StockScreen() {
  const { products, stockHistory, adjustStock, setScreen } = usePos();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [restockProduct, setRestockProduct]     = useState<PosProduct | null>(null);
  const [adjustProduct, setAdjustProduct]       = useState<PosProduct | null>(null);
  const [showOpname, setShowOpname]             = useState(false);
  const [historyFilter, setHistoryFilter]       = useState<StockMoveType | 'all'>('all');
  const [historySearch, setHistorySearch]       = useState('');
  const [showHistSearch, setShowHistSearch]     = useState(false);
  const [overviewSearch, setOverviewSearch]     = useState('');
  const [overviewFilter, setOverviewFilter]     = useState<'all' | 'low' | 'out'>('all');
  const [expandedProduct, setExpandedProduct]   = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter]     = useState(false);
  const [dateFilter, setDateFilter]             = useState<'today' | '7days' | '30days' | 'all'>('all');

  // Stats
  const activeProducts  = products.filter(p => p.isActive);
  const lowStockItems   = activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockItems = activeProducts.filter(p => p.stock === 0);
  const totalStockValue = activeProducts.reduce((sum, p) => sum + p.stock * (p.costPrice || p.price), 0);

  // Filtered history
  const filteredHistory = useMemo(() => {
    let list = [...stockHistory];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date(now);
      if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === '7days') cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === '30days') cutoff.setDate(now.getDate() - 30);
      list = list.filter(h => new Date(h.createdAt) >= cutoff);
    }

    if (historyFilter !== 'all') list = list.filter(h => h.type === historyFilter);
    if (historySearch) list = list.filter(h =>
      h.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.reference.toLowerCase().includes(historySearch.toLowerCase())
    );

    return list;
  }, [stockHistory, historyFilter, historySearch, dateFilter]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, StockHistory[]> = {};
    filteredHistory.forEach(h => {
      const date = fmtDate(h.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(h);
    });
    return groups;
  }, [filteredHistory]);

  // Overview products
  const overviewProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchSearch = !overviewSearch || p.name.toLowerCase().includes(overviewSearch.toLowerCase());
      const matchFilter =
        overviewFilter === 'all' ? true
        : overviewFilter === 'low' ? p.stock > 0 && p.stock <= p.minStock
        : p.stock === 0;
      return matchSearch && matchFilter;
    }).sort((a, b) => a.stock - b.stock);
  }, [activeProducts, overviewSearch, overviewFilter]);

  // Per-product history
  const getProductHistory = (productId: string) =>
    stockHistory.filter(h => h.productId === productId).slice(0, 5);

  const handleRestock = (qty: number, costPrice: number, note: string) => {
    if (!restockProduct) return;
    adjustStock(restockProduct.id, qty, 'restock', note || 'Restock');
    if (costPrice > 0) {
      // Update costPrice
    }
  };

  const handleAdjust = (qty: number, type: StockMoveType, note: string) => {
    if (!adjustProduct) return;
    adjustStock(adjustProduct.id, qty, type, note);
  };

  const handleOpname = (items: { productId: string; actualStock: number; note: string }[]) => {
    let updated = 0;
    items.forEach(({ productId, actualStock, note }) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      const diff = actualStock - product.stock;
      if (diff !== 0) {
        adjustStock(productId, diff, 'adjustment', note || 'Stok Opname');
        updated++;
      }
    });
    toast.success(`Stok opname selesai: ${updated} produk diperbarui`);
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview',  icon: <BarChart3 size={15} /> },
    { key: 'history',  label: 'Riwayat',   icon: <History size={15} /> },
    { key: 'opname',   label: 'Opname',    icon: <ClipboardList size={15} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setScreen('products')}
            className="p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">Manajemen Stok</h1>
            <p className="text-emerald-200 text-xs font-medium">{activeProducts.length} produk aktif</p>
          </div>
          <button
            onClick={() => setShowOpname(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 rounded-xl text-white text-xs font-bold border border-white/20 active:scale-95 transition-all"
          >
            <ClipboardList size={13} />
            Opname
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Produk', val: activeProducts.length, color: 'bg-white/20', textColor: 'text-white' },
            { label: 'Stok Tipis', val: lowStockItems.length, color: lowStockItems.length > 0 ? 'bg-amber-400/30' : 'bg-white/10', textColor: 'text-white' },
            { label: 'Stok Habis', val: outOfStockItems.length, color: outOfStockItems.length > 0 ? 'bg-red-400/30' : 'bg-white/10', textColor: 'text-white' },
            { label: 'Nilai Stok', val: null, valStr: fmt(totalStockValue).replace('Rp\u00a0', 'Rp').slice(0, 8) + '..', color: 'bg-white/20', textColor: 'text-white' },
          ].map(s => (
            <div key={s.label} className={`${s.color} backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 text-center`}>
              <p className={`${s.textColor} font-black text-base leading-tight`}>{s.val !== null ? s.val : s.valStr}</p>
              <p className="text-emerald-200 text-[9px] font-semibold leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">

            {/* Alert section */}
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" />
                  <h3 className="text-sm font-black text-gray-800">Perlu Perhatian</h3>
                  <span className="ml-auto text-xs font-bold text-gray-400">{lowStockItems.length + outOfStockItems.length} produk</span>
                </div>
                <div className="space-y-2">
                  {[...outOfStockItems, ...lowStockItems].slice(0, 5).map(p => (
                    <LowStockCard
                      key={p.id}
                      product={p}
                      onRestock={() => setRestockProduct(p)}
                    />
                  ))}
                  {(outOfStockItems.length + lowStockItems.length) > 5 && (
                    <button
                      onClick={() => setOverviewFilter('out')}
                      className="w-full py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl active:scale-95 transition-all"
                    >
                      Lihat semua ({outOfStockItems.length + lowStockItems.length}) →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Filter + search */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 px-3 py-2.5">
                <Search size={14} className="text-gray-400" />
                <input
                  value={overviewSearch}
                  onChange={e => setOverviewSearch(e.target.value)}
                  placeholder="Cari produk..."
                  className="flex-1 text-sm font-semibold text-gray-700 outline-none bg-transparent"
                />
                {overviewSearch && <button onClick={() => setOverviewSearch('')}><X size={13} className="text-gray-400" /></button>}
              </div>
              <div className="flex gap-2">
                {([
                  { key: 'all', label: 'Semua' },
                  { key: 'low', label: '⚡ Tipis' },
                  { key: 'out', label: '⚠ Habis' },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setOverviewFilter(f.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      overviewFilter === f.key
                        ? f.key === 'out' ? 'bg-red-500 text-white'
                          : f.key === 'low' ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {overviewProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-400">Tidak ada produk</p>
                </div>
              ) : (
                overviewProducts.map((product, i) => {
                  const isOut  = product.stock === 0;
                  const isLow  = product.stock > 0 && product.stock <= product.minStock;
                  const isExpanded = expandedProduct === product.id;
                  const pHistory = getProductHistory(product.id);

                  return (
                    <div key={product.id} className={`${i < overviewProducts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {/* Main row */}
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          {(product.imageUrl || product.imageBase64) ? (
                            <img src={product.imageUrl || product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={18} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-black ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {product.stock} {product.unit}
                            </span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="text-[10px] text-gray-400">Min: {product.minStock}</span>
                            {isOut && <span className="text-[9px] font-black text-white bg-red-500 px-1.5 rounded-full">HABIS</span>}
                            {isLow && <span className="text-[9px] font-black text-white bg-amber-500 px-1.5 rounded-full">TIPIS</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setRestockProduct(product)}
                            className="p-2 rounded-xl bg-emerald-50 active:scale-90 transition-all"
                          >
                            <TrendingUp size={14} className="text-emerald-600" />
                          </button>
                          <button
                            onClick={() => setAdjustProduct(product)}
                            className="p-2 rounded-xl bg-orange-50 active:scale-90 transition-all"
                          >
                            <TrendingDown size={14} className="text-orange-500" />
                          </button>
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                            className="p-2 rounded-xl bg-gray-50 active:scale-90 transition-all"
                          >
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Stock bar */}
                      <div className="px-4 pb-3">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, product.minStock > 0 ? (product.stock / (product.minStock * 3)) * 100 : 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded history */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                          <p className="text-xs font-black text-gray-500 mb-2">5 Riwayat Terakhir</p>
                          {pHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 font-medium py-2 text-center">Belum ada riwayat</p>
                          ) : (
                            <div className="space-y-2">
                              {pHistory.map(h => {
                                const cfg = MOVE_TYPE_CONFIG[h.type];
                                const isIn = h.quantity > 0;
                                return (
                                  <div key={h.id} className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                      {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                        <span className={`text-xs font-black ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                                          {isIn ? '+' : ''}{h.quantity}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 truncate">{h.reference} · {fmtDate(h.createdAt)}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-3">

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistSearch(v => !v)}
                className="p-2.5 bg-white rounded-xl border border-gray-200 active:scale-90 transition-all"
              >
                <Search size={15} className="text-gray-500" />
              </button>
              <button
                onClick={() => setShowDateFilter(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-600 active:scale-95 transition-all"
              >
                <Calendar size={13} />
                {dateFilter === 'all' ? 'Semua Waktu' : dateFilter === 'today' ? 'Hari Ini' : dateFilter === '7days' ? '7 Hari' : '30 Hari'}
                <ChevronDown size={11} />
              </button>
              <div className="ml-auto text-xs font-bold text-gray-400 bg-white border border-gray-200 px-3 py-2.5 rounded-xl">
                {filteredHistory.length} log
              </div>
            </div>

            {/* Search */}
            {showHistSearch && (
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 px-3 py-2.5">
                <Search size={14} className="text-gray-400" />
                <input
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Cari nama produk atau referensi..."
                  className="flex-1 text-sm font-semibold text-gray-700 outline-none bg-transparent"
                  autoFocus
                />
                {historySearch && <button onClick={() => setHistorySearch('')}><X size={13} className="text-gray-400" /></button>}
              </div>
            )}

            {/* Date filter pills */}
            {showDateFilter && (
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'all', label: 'Semua' },
                  { key: 'today', label: 'Hari Ini' },
                  { key: '7days', label: '7 Hari' },
                  { key: '30days', label: '30 Hari' },
                ] as const).map(d => (
                  <button
                    key={d.key}
                    onClick={() => { setDateFilter(d.key); setShowDateFilter(false); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      dateFilter === d.key ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Type filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {([
                { key: 'all',        label: 'Semua' },
                { key: 'sale',       label: '🛒 Jual' },
                { key: 'restock',    label: '📦 Restock' },
                { key: 'adjustment', label: '🔧 Koreksi' },
                { key: 'damage',     label: '⚠️ Rusak' },
                { key: 'return',     label: '↩️ Retur' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setHistoryFilter(f.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    historyFilter === f.key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* History list */}
            {Object.keys(groupedHistory).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-3">
                  <History size={28} className="text-emerald-400" />
                </div>
                <p className="text-base font-black text-gray-600 mb-1">Belum Ada Riwayat</p>
                <p className="text-sm text-gray-400 text-center">Pergerakan stok akan tercatat di sini</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs font-bold text-gray-400 px-2">{date}</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {items.map(item => <HistoryItem key={item.id} item={item} />)}
                  </div>
                </div>
              ))
            )}
            <div className="h-4" />
          </div>
        )}

        {/* ─── OPNAME TAB ─── */}
        {activeTab === 'opname' && (
          <div className="p-4 space-y-4">
            {/* Info card */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ClipboardList size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Stok Opname</h3>
                  <p className="text-blue-100 text-xs font-medium">Hitung & sesuaikan stok aktual</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Stok opname membantu mencocokkan stok di sistem dengan stok fisik di gudang. Semua selisih akan otomatis dicatat dalam riwayat.
              </p>
              <button
                onClick={() => setShowOpname(true)}
                className="w-full py-3 bg-white rounded-2xl text-blue-700 font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ClipboardList size={16} />
                Mulai Stok Opname
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-400 mb-1">Total Produk Aktif</p>
                <p className="text-2xl font-black text-gray-900">{activeProducts.length}</p>
                <p className="text-[10px] text-gray-400 mt-1">produk perlu dicek</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-400 mb-1">Nilai Stok Total</p>
                <p className="text-lg font-black text-emerald-600">{fmt(totalStockValue)}</p>
                <p className="text-[10px] text-gray-400 mt-1">berdasarkan harga modal</p>
              </div>
            </div>

            {/* Last opname history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-800">Riwayat Opname Terakhir</h3>
                <button
                  onClick={() => { setHistoryFilter('adjustment'); setActiveTab('history'); }}
                  className="text-xs font-bold text-emerald-600 flex items-center gap-1 active:opacity-70"
                >
                  Lihat semua <ChevronRight size={12} />
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {stockHistory.filter(h => h.type === 'adjustment').length === 0 ? (
                  <div className="py-8 text-center">
                    <RefreshCw size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400">Belum pernah opname</p>
                  </div>
                ) : (
                  stockHistory.filter(h => h.type === 'adjustment').slice(0, 5).map(item => (
                    <HistoryItem key={item.id} item={item} />
                  ))
                )}
              </div>
            </div>

            <div className="h-4" />
          </div>
        )}
      </div>

      {/* FAB - Quick restock */}
      {activeTab === 'overview' && (
        <button
          onClick={() => setShowOpname(true)}
          className="fixed bottom-6 right-5 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/40 text-white text-sm font-black active:scale-90 transition-all z-50"
          style={{ maxWidth: 'calc(512px - 40px)' }}
        >
          <ClipboardList size={16} />
          Stok Opname
        </button>
      )}

      {/* Modals */}
      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onConfirm={handleRestock}
        />
      )}
      {adjustProduct && (
        <AdjustmentModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onConfirm={handleAdjust}
        />
      )}
      {showOpname && (
        <OpnameModal
          products={products}
          onClose={() => setShowOpname(false)}
          onConfirm={handleOpname}
        />
      )}
    </div>
  );
}
