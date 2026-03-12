import { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, Plus, Search, Grid3X3, List, Package,
  Pencil, Trash2, ImagePlus, Upload, X, CheckCircle2,
  AlertTriangle, Tag, Layers, ChevronDown, SlidersHorizontal,
  BarChart2, RefreshCw,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosProduct, PosCategory } from '../types';
import { createPortal } from 'react-dom';
import { fileToBase64, fileToDataUrl, uploadImageToGDrive } from '../utils/gas';
import { generateSku } from '../utils/storage';
import toast from 'react-hot-toast';

// ─── Currency formatter ───────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const UNITS = ['pcs', 'kg', 'gram', 'liter', 'ml', 'lusin', 'box', 'pack', 'botol', 'lembar', 'meter', 'porsi'];

// ─── Image Upload Widget ──────────────────────────────────────────────────────
function ImageUpload({
  preview,
  uploading,
  onFileSelect,
  onClear,
}: {
  preview: string;
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {preview ? (
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-violet-200 shadow-md">
            <img src={preview} alt="product" className="w-full h-full object-cover" />
            {!uploading && (
              <button
                onClick={onClear}
                className="absolute top-1 right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md"
              >
                <X size={12} className="text-white" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <RefreshCw size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-28 h-28 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImagePlus size={28} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-400">Foto Produk</span>
          </button>
        )}
      </div>

      {preview && !uploading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs font-bold text-violet-500 flex items-center gap-1 active:opacity-70"
        >
          <Upload size={12} /> Ganti Foto
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        JPG/PNG · Maks 5MB
        <br />
        Akan diupload ke Google Drive
      </p>
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: PosProduct;
  onSave: (data: Omit<PosProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}) {
  const { categories, store } = usePos();
  const activeCategories = categories.filter(c => c.isActive);

  const [name, setName]           = useState(initial?.name ?? '');
  const [sku, setSku]             = useState(initial?.sku ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [price, setPrice]         = useState(initial?.price ? String(initial.price) : '');
  const [costPrice, setCostPrice] = useState(initial?.costPrice ? String(initial.costPrice) : '');
  const [stock, setStock]         = useState(initial?.stock ? String(initial.stock) : '');
  const [minStock, setMinStock]   = useState(initial?.minStock ? String(initial.minStock) : '5');
  const [unit, setUnit]           = useState(initial?.unit ?? 'pcs');
  const [barcode, setBarcode]     = useState(initial?.barcode ?? '');
  const [isActive, setIsActive]   = useState(initial?.isActive ?? true);
  const [imagePreview, setImagePreview] = useState(initial?.imageBase64 ?? initial?.imageUrl ?? '');
  const [imageBase64, setImageBase64]   = useState(initial?.imageBase64 ?? '');
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [showUnits, setShowUnits]       = useState(false);

  // Auto-generate SKU when name changes (only for new products)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!initial && !sku) {
      setSku(generateSku(val));
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
      const b64 = await fileToBase64(file);
      setImageBase64(b64);
    } catch {
      toast.error('Gagal memuat gambar');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama produk wajib diisi';
    if (!price || Number(price) <= 0) e.price = 'Harga jual harus lebih dari 0';
    if (stock !== '' && Number(stock) < 0) e.stock = 'Stok tidak boleh negatif';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    let finalImageUrl = initial?.imageUrl ?? '';
    let finalImageBase64 = imageBase64;

    // Upload to Google Drive if there's a new image
    if (imageBase64 && imageBase64 !== initial?.imageBase64) {
      if (!store.gasUrl) {
        toast.error('GAS URL belum diset. Foto disimpan lokal saja.');
        finalImageUrl = imagePreview; // fallback to base64 data URL
      } else {
        try {
          setUploading(true);
          const filename = `product_${Date.now()}.jpg`;
          finalImageUrl = await uploadImageToGDrive(store.gasUrl, imageBase64, filename);
          toast.success('Foto berhasil diupload ke Google Drive!');
        } catch (err) {
          toast.error('Upload foto gagal, disimpan lokal saja');
          finalImageUrl = imagePreview;
        } finally {
          setUploading(false);
        }
      }
    }

    await onSave({
      sku: sku || generateSku(name),
      name: name.trim(),
      categoryId,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5,
      unit,
      imageUrl: finalImageUrl,
      imageBase64: finalImageBase64,
      barcode,
      isActive,
    });

    setSaving(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[96dvh] flex flex-col">

        {/* Sticky Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">
              {initial ? 'Edit Produk' : 'Produk Baru'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsActive(v => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isActive ? '● Aktif' : '○ Nonaktif'}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Photo + Name row */}
          <div className="flex gap-4 items-start">
            <ImageUpload
              preview={imagePreview}
              uploading={uploading}
              onFileSelect={handleFileSelect}
              onClear={() => { setImagePreview(''); setImageBase64(''); }}
            />
            <div className="flex-1 space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Produk *</label>
                <input
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Nama produk..."
                  className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none text-sm font-semibold bg-gray-50 transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-200 focus:border-violet-400'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold mt-1">{errors.name}</p>}
              </div>
              {/* SKU */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
                <input
                  value={sku}
                  onChange={e => setSku(e.target.value.toUpperCase())}
                  placeholder="Auto-generate..."
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm font-mono bg-gray-50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kategori</label>
            {activeCategories.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle size={14} className="text-amber-500" />
                <p className="text-xs text-amber-700 font-semibold">Buat kategori dulu di menu Produk → Kategori</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryId('')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    !categoryId ? 'bg-gray-900 text-white ring-2 ring-gray-900' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Semua
                </button>
                {activeCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      categoryId === cat.id ? 'ring-2 ring-offset-1 shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: categoryId === cat.id ? cat.color : '#F9FAFB',
                      color: categoryId === cat.id ? '#1F2937' : '#6B7280',
                    }}
                  >
                    {cat.emoji} {cat.name}
                    {categoryId === cat.id && <CheckCircle2 size={10} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={14} className="text-violet-500" />
              <p className="text-sm font-bold text-gray-800">Harga</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Harga Jual *</label>
                <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 focus-within:border-violet-400 px-3 py-2.5 transition-colors">
                  <span className="text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={price}
                    onChange={e => { setPrice(e.target.value); setErrors(v => ({ ...v, price: '' })); }}
                    placeholder="0"
                    className="flex-1 text-sm font-bold outline-none bg-transparent text-gray-900"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 font-semibold mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Harga Modal</label>
                <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 focus-within:border-violet-400 px-3 py-2.5 transition-colors">
                  <span className="text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-sm font-bold outline-none bg-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
            {price && costPrice && Number(price) > 0 && Number(costPrice) > 0 && (
              <div className="bg-white rounded-xl p-2.5 border border-violet-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Margin Keuntungan</span>
                <span className="text-sm font-black text-emerald-600">
                  {fmt(Number(price) - Number(costPrice))}
                  <span className="text-xs ml-1 text-gray-400">
                    ({Math.round(((Number(price) - Number(costPrice)) / Number(price)) * 100)}%)
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Layers size={14} className="text-emerald-600" />
              <p className="text-sm font-bold text-gray-800">Stok & Satuan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Stok Awal</label>
                <input
                  type="number"
                  value={stock}
                  onChange={e => { setStock(e.target.value); setErrors(v => ({ ...v, stock: '' })); }}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm font-bold bg-white transition-colors"
                />
                {errors.stock && <p className="text-xs text-red-500 font-semibold mt-1">{errors.stock}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Minimum Stok</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={e => setMinStock(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-sm font-bold bg-white transition-colors"
                />
              </div>
            </div>
            {/* Unit Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Satuan</label>
              <button
                onClick={() => setShowUnits(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-900"
              >
                <span>{unit}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUnits ? 'rotate-180' : ''}`} />
              </button>
              {showUnits && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {UNITS.map(u => (
                    <button
                      key={u}
                      onClick={() => { setUnit(u); setShowUnits(false); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        unit === u ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Barcode (Opsional)</label>
            <input
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan atau ketik barcode..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm font-mono bg-gray-50 transition-colors"
            />
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving || uploading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                {uploading ? 'Mengupload...' : 'Menyimpan...'}
              </>
            ) : (
              <>{initial ? 'Simpan Perubahan' : 'Tambah Produk'}</>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-5" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full shadow-2xl">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-black text-center text-gray-900 mb-1">Hapus Produk?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <strong>"{name}"</strong> akan dihapus permanen beserta riwayat stoknya.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95">Batal</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 active:scale-95">Hapus</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Product Card (Grid View) ─────────────────────────────────────────────────
function ProductCard({ product, cat, onEdit, onDelete }: {
  product: PosProduct;
  cat?: PosCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm active:scale-[0.97] transition-all ${
      !product.isActive ? 'opacity-60' : ''
    } ${isOutOfStock ? 'border-red-200' : isLowStock ? 'border-amber-200' : 'border-gray-100'}`}>
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {(product.imageUrl || product.imageBase64) ? (
          <img
            src={product.imageUrl || product.imageBase64}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-gray-300" />
          </div>
        )}
        {/* Stock badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            HABIS
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            TIPIS
          </div>
        )}
        {!product.isActive && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-black text-gray-400 bg-white px-2 py-1 rounded-full border">Nonaktif</span>
          </div>
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm active:scale-90"
          >
            <Pencil size={11} className="text-violet-600" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm active:scale-90"
          >
            <Trash2 size={11} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {cat && (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold mb-1.5"
            style={{ backgroundColor: cat.color, color: '#1F2937' }}
          >
            {cat.emoji} {cat.name}
          </div>
        )}
        <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
        <p className="text-sm font-black text-violet-600">{fmt(product.price)}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-gray-400'}`}>
            {product.stock} {product.unit}
          </span>
          <span className="text-[9px] font-mono text-gray-300">{product.sku}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Product Row (List View) ──────────────────────────────────────────────────
function ProductRow({ product, cat, onEdit, onDelete }: {
  product: PosProduct;
  cat?: PosCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!product.isActive ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className={`w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 ${
        isOutOfStock ? 'ring-2 ring-red-300' : isLowStock ? 'ring-2 ring-amber-300' : 'bg-gray-100'
      }`}>
        {(product.imageUrl || product.imageBase64) ? (
          <img src={product.imageUrl || product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Package size={20} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
          {!product.isActive && <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 rounded-full flex-shrink-0">OFF</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-violet-600">{fmt(product.price)}</p>
          {cat && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{ backgroundColor: cat.color, color: '#374151' }}
            >
              {cat.emoji} {cat.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-gray-400'}`}>
            {isOutOfStock ? '⚠ Stok Habis' : isLowStock ? `⚡ ${product.stock} ${product.unit}` : `${product.stock} ${product.unit}`}
          </span>
          <span className="text-[10px] font-mono text-gray-300">{product.sku}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onEdit} className="p-2 rounded-xl bg-violet-50 active:scale-90 transition-all">
          <Pencil size={14} className="text-violet-500" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-xl bg-red-50 active:scale-90 transition-all">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({
  selectedCat,
  onSelectCat,
  filter,
  onFilter,
}: {
  selectedCat: string;
  onSelectCat: (id: string) => void;
  filter: 'all' | 'low' | 'out' | 'inactive';
  onFilter: (f: 'all' | 'low' | 'out' | 'inactive') => void;
}) {
  const { categories } = usePos();
  const active = categories.filter(c => c.isActive);

  return (
    <div className="space-y-2 px-4 py-3">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onSelectCat('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !selectedCat ? 'bg-violet-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          Semua
        </button>
        {active.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCat(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              selectedCat === cat.id ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'
            }`}
            style={selectedCat === cat.id ? { backgroundColor: '#7C3AED' } : {}}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {([
          { key: 'all', label: 'Semua Produk' },
          { key: 'low', label: '⚡ Stok Tipis' },
          { key: 'out', label: '⚠ Habis' },
          { key: 'inactive', label: '○ Nonaktif' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.key
                ? f.key === 'out' ? 'bg-red-500 text-white'
                  : f.key === 'low' ? 'bg-amber-500 text-white'
                  : f.key === 'inactive' ? 'bg-gray-500 text-white'
                  : 'bg-violet-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Products Screen ─────────────────────────────────────────────────────
export default function ProductsScreen() {
  const { products, categories, addProduct, updateProduct, deleteProduct, setScreen } = usePos();

  const [search, setSearch]         = useState('');
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid');
  const [selectedCat, setSelectedCat] = useState('');
  const [filter, setFilter]         = useState<'all' | 'low' | 'out' | 'inactive'>('all');
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState<PosProduct | null>(null);
  const [deleteItem, setDeleteItem] = useState<PosProduct | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const getCat = useCallback((id: string) => categories.find(c => c.id === id), [categories]);

  // Filter & search
  const filtered = products.filter(p => {
    const matchCat = !selectedCat || p.categoryId === selectedCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true
      : filter === 'low' ? p.stock > 0 && p.stock <= p.minStock && p.isActive
      : filter === 'out' ? p.stock === 0 && p.isActive
      : !p.isActive;
    return matchCat && matchSearch && matchFilter;
  });

  const activeCount    = products.filter(p => p.isActive).length;
  const lowStockCount  = products.filter(p => p.isActive && p.stock > 0 && p.stock <= p.minStock).length;
  const outCount       = products.filter(p => p.isActive && p.stock === 0).length;

  const handleSave = async (data: Omit<PosProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editItem) {
      await updateProduct(editItem.id, data);
    } else {
      await addProduct(data);
    }
    setEditItem(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">Produk</h1>
            <p className="text-violet-200 text-xs font-medium">{activeCount} produk aktif</p>
          </div>
          <button
            onClick={() => setShowSearch(v => !v)}
            className="p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <Search size={18} className="text-white" />
          </button>
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            {viewMode === 'grid' ? <List size={18} className="text-white" /> : <Grid3X3 size={18} className="text-white" />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Produk', val: activeCount, color: 'bg-white/20' },
            { label: 'Stok Tipis', val: lowStockCount, color: lowStockCount > 0 ? 'bg-amber-400/30' : 'bg-white/10' },
            { label: 'Stok Habis', val: outCount, color: outCount > 0 ? 'bg-red-400/30' : 'bg-white/10' },
          ].map(s => (
            <div key={s.label} className={`${s.color} backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center`}>
              <p className="text-white font-black text-xl">{s.val}</p>
              <p className="text-violet-200 text-[10px] font-semibold leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-3 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
            <Search size={15} className="text-violet-200" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama produk atau SKU..."
              className="flex-1 bg-transparent text-white placeholder-violet-300 text-sm font-semibold outline-none"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-violet-200" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => setScreen('categories' as any)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold active:scale-95 transition-all border border-violet-100"
        >
          <Grid3X3 size={13} />
          Kategori
        </button>
        <button
          onClick={() => setScreen('stock' as any)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold active:scale-95 transition-all border border-emerald-100"
        >
          <BarChart2 size={13} />
          Manaj. Stok
        </button>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-violet-500/25 active:scale-95 transition-all"
        >
          <Plus size={14} />
          Produk Baru
        </button>
      </div>

      {/* Filter */}
      <FilterBar
        selectedCat={selectedCat}
        onSelectCat={setSelectedCat}
        filter={filter}
        onFilter={setFilter}
      />

      {/* Content */}
      <div className="flex-1 px-4 pb-4">

        {/* Results count */}
        {(search || selectedCat || filter !== 'all') && (
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={12} className="text-gray-400" />
            <p className="text-xs text-gray-500 font-semibold">
              {filtered.length} produk ditemukan
              {search && ` · "${search}"`}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCat(''); setFilter('all'); }}
              className="ml-auto text-xs text-violet-500 font-bold active:opacity-70"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mb-4">
              <Package size={36} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-1">
              {products.length === 0 ? 'Belum Ada Produk' : 'Produk Tidak Ditemukan'}
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {products.length === 0
                ? 'Tambahkan produk pertama Anda sekarang'
                : 'Coba ubah kata kunci atau filter'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => { setEditItem(null); setShowModal(true); }}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 active:scale-95 flex items-center gap-2"
              >
                <Plus size={16} />
                Tambah Produk Pertama
              </button>
            )}
          </div>
        )}

        {/* Grid / List View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                cat={getCat(p.categoryId)}
                onEdit={() => { setEditItem(p); setShowModal(true); }}
                onDelete={() => setDeleteItem(p)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filtered.map(p => (
              <ProductRow
                key={p.id}
                product={p}
                cat={getCat(p.categoryId)}
                onEdit={() => { setEditItem(p); setShowModal(true); }}
                onDelete={() => setDeleteItem(p)}
              />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditItem(null); setShowModal(true); }}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/40 flex items-center justify-center active:scale-90 transition-all z-50"
        style={{ maxWidth: 'calc(512px - 40px)' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Modals */}
      {showModal && (
        <ProductModal
          initial={editItem ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
      {deleteItem && (
        <DeleteConfirm
          name={deleteItem.name}
          onConfirm={() => deleteProduct(deleteItem.id)}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
