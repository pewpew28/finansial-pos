import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, WALLET_COLORS } from '../utils/format';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const WALLET_ICONS = [
  { id: 'wallet', emoji: '👛' }, { id: 'card', emoji: '💳' },
  { id: 'bank', emoji: '🏦' }, { id: 'piggy', emoji: '🐷' },
  { id: 'bag', emoji: '💼' }, { id: 'phone', emoji: '📱' },
  { id: 'star', emoji: '⭐' }, { id: 'dollar', emoji: '💵' },
  { id: 'gem', emoji: '💎' }, { id: 'chart', emoji: '📈' },
];

const getEmoji = (id: string) => WALLET_ICONS.find(i => i.id === id)?.emoji ?? '👛';

export default function WalletsScreen() {
  const { wallets, transactions, addWallet, updateWallet, deleteWallet } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', balance: '', color: WALLET_COLORS[0], icon: 'wallet' });

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const openAdd = () => { setEditId(null); setForm({ name: '', balance: '', color: WALLET_COLORS[0], icon: 'wallet' }); setShowModal(true); };
  const openEdit = (id: string) => {
    const w = wallets.find(x => x.id === id); if (!w) return;
    setEditId(id); setForm({ name: w.name, balance: String(w.balance), color: w.color, icon: w.icon }); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.balance) return;
    const bal = parseFloat(form.balance.replace(/\./g, ''));
    if (editId) await updateWallet(editId, { name: form.name.trim(), balance: bal, color: form.color, icon: form.icon });
    else await addWallet({ name: form.name.trim(), balance: bal, color: form.color, icon: form.icon });
    setShowModal(false);
  };

  const getStats = (wid: string) => {
    const txs = transactions.filter(t => t.walletId === wid);
    return { income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), count: txs.length };
  };

  const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (
    <div className="pb-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 px-5 pt-14 pb-24">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="flex items-start justify-between">
          <div><h1 className="text-white text-xl font-black">Dompet</h1><p className="text-white/60 text-xs mt-0.5">{wallets.length} dompet aktif</p></div>
          <button onClick={openAdd} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow"><Plus size={16} className="text-violet-600" /></button>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Total Saldo</p>
          <p className="text-white text-3xl font-black mt-1">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div className="px-4 -mt-12 space-y-3 relative z-10">
        {wallets.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center text-gray-400">
            <p className="text-5xl mb-3">👛</p><p className="font-bold text-gray-600">Belum ada dompet</p><p className="text-sm mt-1">Ketuk + untuk menambah dompet</p>
          </div>
        ) : wallets.map((w, idx) => {
          const stats = getStats(w.id);
          return (
            <div key={w.id} className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100">
              <div className="relative p-5 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${w.color}20, ${w.color}08)` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0" style={{ background: w.color }}>{getEmoji(w.icon)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-gray-900 text-base truncate">{w.name}</p>
                    {idx === 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${w.color}30`, color: w.color }}>UTAMA</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.count} transaksi</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400 font-medium">Saldo</p>
                  <p className="font-black text-gray-900 text-base">{formatCurrency(w.balance)}</p>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center"><TrendingUp size={10} className="text-emerald-600" /></div>
                  <div><p className="text-[9px] text-gray-400 font-medium">MASUK</p><p className="text-xs font-black text-emerald-600">{formatCurrency(stats.income)}</p></div>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown size={10} className="text-red-500" /></div>
                  <div><p className="text-[9px] text-gray-400 font-medium">KELUAR</p><p className="text-xs font-black text-red-500">{formatCurrency(stats.expense)}</p></div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => openEdit(w.id)} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90" style={{ background: `${w.color}20` }}><Pencil size={13} style={{ color: w.color }} /></button>
                  <button onClick={() => setDeleteId(w.id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center active:scale-90"><Trash2 size={13} className="text-red-500" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={openAdd} className="fixed bottom-24 right-4 w-14 h-14 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/40 flex items-center justify-center z-[90] active:scale-90 transition-transform"><Plus size={24} className="text-white" /></button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Dompet' : 'Tambah Dompet'}>
        <div className="space-y-4">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${form.color}15` }}>
            <div className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center shadow-sm" style={{ background: form.color }}>{getEmoji(form.icon)}</div>
            <div><p className="font-black text-gray-900">{form.name || 'Nama Dompet'}</p><p className="text-sm text-gray-500">Rp {form.balance || '0'}</p></div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Nama Dompet</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: BCA, Dana, Tunai..."
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-semibold" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Saldo {editId ? 'Saat Ini' : 'Awal'}</label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
              <input type="text" inputMode="numeric" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: fmt(e.target.value) }))} placeholder="0"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-xl font-black outline-none focus:border-violet-400 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-2.5 block">Warna</label>
            <div className="flex flex-wrap gap-2.5">
              {WALLET_COLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-9 h-9 rounded-xl transition-all active:scale-90 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ background: c }} />)}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-2.5 block">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {WALLET_ICONS.map(ic => (
                <button key={ic.id} onClick={() => setForm(f => ({ ...f, icon: ic.id }))}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${form.icon === ic.id ? 'ring-2 ring-violet-500 scale-110' : 'bg-gray-100'}`}
                  style={form.icon === ic.id ? { background: `${form.color}25` } : {}}>{ic.emoji}</button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.name.trim() || !form.balance}
            className="w-full py-4 bg-violet-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all">
            {editId ? 'Simpan Perubahan' : 'Tambah Dompet'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteWallet(deleteId); }}
        title="Hapus Dompet?" message="Dompet ini akan dihapus permanen. Data transaksi terkait tetap tersimpan." />
    </div>
  );
}
