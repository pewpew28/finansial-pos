import { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Grid3X3, ChevronRight, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosCategory } from '../types';
import { createPortal } from 'react-dom';

// ─── Emoji & Color Options ────────────────────────────────────────────────────
const CATEGORY_EMOJIS = [
  '🍔','🍕','🍜','🍣','🥤','☕','🍰','🍿','🛍️','👕',
  '👟','💄','📱','💻','🎮','📚','🏠','🌿','🧴','💊',
  '🔧','⚡','🎵','🎨','🏋️','🐾','✈️','🚗','🎁','💎',
];

const CATEGORY_COLORS = [
  { name: 'Merah',    bg: '#FEE2E2', text: '#DC2626', ring: '#FECACA' },
  { name: 'Oranye',  bg: '#FFEDD5', text: '#EA580C', ring: '#FED7AA' },
  { name: 'Kuning',  bg: '#FEF9C3', text: '#CA8A04', ring: '#FEF08A' },
  { name: 'Hijau',   bg: '#DCFCE7', text: '#16A34A', ring: '#BBF7D0' },
  { name: 'Teal',    bg: '#CCFBF1', text: '#0D9488', ring: '#99F6E4' },
  { name: 'Biru',    bg: '#DBEAFE', text: '#2563EB', ring: '#BFDBFE' },
  { name: 'Indigo',  bg: '#E0E7FF', text: '#4F46E5', ring: '#C7D2FE' },
  { name: 'Ungu',    bg: '#F3E8FF', text: '#9333EA', ring: '#E9D5FF' },
  { name: 'Pink',    bg: '#FCE7F3', text: '#DB2777', ring: '#FBCFE8' },
  { name: 'Abu',     bg: '#F3F4F6', text: '#4B5563', ring: '#E5E7EB' },
];

// ─── Category Form Modal ──────────────────────────────────────────────────────
function CategoryModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: PosCategory;
  onSave: (data: Omit<PosCategory, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const { categories } = usePos();
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🛍️');
  const [colorIdx, setColorIdx] = useState(() => {
    if (!initial) return 5;
    return CATEGORY_COLORS.findIndex(c => c.bg === initial.color) ?? 5;
  });
  const [isActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState('');

  const selectedColor = CATEGORY_COLORS[colorIdx] ?? CATEGORY_COLORS[5];

  const handleSave = () => {
    if (!name.trim()) { setError('Nama kategori wajib diisi'); return; }
    const duplicate = categories.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== initial?.id
    );
    if (duplicate) { setError('Nama kategori sudah ada'); return; }

    onSave({
      name: name.trim(),
      emoji,
      color: selectedColor.bg,
      isActive,
      sortOrder: initial?.sortOrder ?? categories.length,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] overflow-y-auto">

        {/* Handle */}
        <div className="sticky top-0 bg-white pt-4 pb-3 px-5 z-10 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">
              {initial ? 'Edit Kategori' : 'Kategori Baru'}
            </h2>
            {/* Preview badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: selectedColor.bg, color: selectedColor.text }}
            >
              <span>{emoji}</span>
              <span>{name || 'Preview'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nama Kategori *
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Contoh: Makanan, Minuman, Elektronik..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-violet-400 outline-none text-sm font-semibold text-gray-900 bg-gray-50 transition-colors"
            />
            {error && <p className="text-xs text-red-500 font-semibold mt-1.5">{error}</p>}
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Icon Emoji
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {CATEGORY_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${
                    emoji === e
                      ? 'ring-2 ring-violet-500 bg-violet-50 scale-110'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Warna
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    colorIdx === i ? 'ring-2 ring-offset-1 scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: c.bg,
                    color: c.text,
                  }}
                >
                  {colorIdx === i && <CheckCircle2 size={10} />}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all"
          >
            {initial ? 'Simpan Perubahan' : 'Tambah Kategori'}
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
        <h3 className="text-lg font-black text-center text-gray-900 mb-1">Hapus Kategori?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Kategori <strong>"{name}"</strong> akan dihapus permanen.
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoriesScreen({ onBack }: { onBack: () => void }) {
  const { categories, addCategory, updateCategory, deleteCategory } = usePos();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PosCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<PosCategory | null>(null);

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const active = sorted.filter(c => c.isActive);
  const inactive = sorted.filter(c => !c.isActive);

  const handleSave = (data: Omit<PosCategory, 'id' | 'createdAt'>) => {
    if (editItem) {
      updateCategory(editItem.id, data);
    } else {
      addCategory(data);
    }
    setEditItem(null);
  };

  const toggleActive = (cat: PosCategory) => {
    updateCategory(cat.id, { isActive: !cat.isActive });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-xl">Kategori Produk</h1>
            <p className="text-violet-200 text-xs font-medium">{categories.length} kategori tersedia</p>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="ml-auto p-2.5 bg-white/15 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <p className="text-white font-black text-2xl">{active.length}</p>
            <p className="text-violet-200 text-xs font-semibold">Aktif</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <p className="text-white font-black text-2xl">{inactive.length}</p>
            <p className="text-violet-200 text-xs font-semibold">Nonaktif</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Active Categories */}
        {active.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Grid3X3 size={15} className="text-violet-500" />
              <p className="text-sm font-bold text-gray-900">Kategori Aktif</p>
              <span className="ml-auto text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{active.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {active.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={() => { setEditItem(cat); setShowModal(true); }}
                  onDelete={() => setDeleteItem(cat)}
                  onToggle={() => toggleActive(cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Categories */}
        {inactive.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Grid3X3 size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-500">Nonaktif</p>
              <span className="ml-auto text-xs font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{inactive.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {inactive.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={() => { setEditItem(cat); setShowModal(true); }}
                  onDelete={() => setDeleteItem(cat)}
                  onToggle={() => toggleActive(cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mb-4">
              <Grid3X3 size={36} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-1">Belum Ada Kategori</h3>
            <p className="text-sm text-gray-400 font-medium text-center mb-6">
              Buat kategori untuk mengelompokkan produk Anda
            </p>
            <button
              onClick={() => { setEditItem(null); setShowModal(true); }}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              Buat Kategori Pertama
            </button>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* FAB */}
      {categories.length > 0 && (
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/40 flex items-center justify-center active:scale-90 transition-all z-50"
          style={{ maxWidth: 'calc(512px - 40px)' }}
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

      {/* Modals */}
      {showModal && (
        <CategoryModal
          initial={editItem ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
      {deleteItem && (
        <DeleteConfirm
          name={deleteItem.name}
          onConfirm={() => deleteCategory(deleteItem.id)}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  onEdit,
  onDelete,
  onToggle,
}: {
  cat: PosCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!cat.isActive ? 'opacity-50' : ''}`}>
      {/* Icon badge */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: cat.color }}
      >
        {cat.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{cat.name}</p>
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5"
          style={{ backgroundColor: cat.color + '80' }}
        >
          <span>{cat.isActive ? '● Aktif' : '○ Nonaktif'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl bg-gray-100 active:scale-90 transition-all"
        >
          {cat.isActive
            ? <ToggleRight size={16} className="text-emerald-500" />
            : <ToggleLeft size={16} className="text-gray-400" />
          }
        </button>
        <button onClick={onEdit} className="p-2 rounded-xl bg-violet-50 active:scale-90 transition-all">
          <Pencil size={14} className="text-violet-500" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-xl bg-red-50 active:scale-90 transition-all">
          <Trash2 size={14} className="text-red-400" />
        </button>
        <ChevronRight size={14} className="text-gray-300 ml-1" />
      </div>
    </div>
  );
}
