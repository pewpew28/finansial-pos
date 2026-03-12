import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Trash2, CheckCircle2, CreditCard, Calendar, Zap } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function InstallmentsScreen() {
  const { installments, wallets, addInstallment, deleteInstallment, payInstallmentMonth } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', totalAmount: '', monthlyAmount: '', totalCount: '', walletId: wallets[0]?.id ?? '', startDate: new Date().toISOString().split('T')[0], description: '', icon: 'other' });

  const active = installments.filter(i => i.status === 'active');
  const paid = installments.filter(i => i.status === 'paid');
  const totalMonthly = active.reduce((s, i) => s + i.monthlyAmount, 0);

  const handleSubmit = async () => {
    if (!form.name || !form.monthlyAmount || !form.totalCount || !form.walletId) return;
    const monthly = parseFloat(form.monthlyAmount.replace(/\./g, ''));
    const total = form.totalAmount ? parseFloat(form.totalAmount.replace(/\./g, '')) : monthly * parseInt(form.totalCount);
    await addInstallment({ name: form.name, totalAmount: total, monthlyAmount: monthly, paidCount: 0, totalCount: parseInt(form.totalCount), walletId: form.walletId, startDate: form.startDate, status: 'active', description: form.description });
    setShowModal(false);
    setForm({ name: '', totalAmount: '', monthlyAmount: '', totalCount: '', walletId: wallets[0]?.id ?? '', startDate: new Date().toISOString().split('T')[0], description: '', icon: 'other' });
  };

  const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const getNextDate = (startDate: string, paidCount: number) => { const d = new Date(startDate); d.setMonth(d.getMonth() + paidCount + 1); return d.toISOString(); };
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('motor') || lower.includes('honda') || lower.includes('yamaha')) return '🏍️';
    if (lower.includes('mobil') || lower.includes('car')) return '🚗';
    if (lower.includes('rumah') || lower.includes('kpr')) return '🏠';
    if (lower.includes('hp') || lower.includes('phone') || lower.includes('iphone')) return '📱';
    if (lower.includes('laptop') || lower.includes('pc')) return '💻';
    return '💳';
  };

  return (
    <div className="pb-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-14 pb-24">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="flex items-start justify-between">
          <div><h1 className="text-white text-xl font-black">Cicilan</h1><p className="text-white/60 text-xs mt-0.5">{active.length} aktif · {paid.length} lunas</p></div>
          <button onClick={() => setShowModal(true)} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow"><Plus size={16} className="text-violet-600" /></button>
        </div>
        <div className="mt-4"><p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Total per Bulan</p><p className="text-white text-3xl font-black mt-1">{formatCurrency(totalMonthly)}</p></div>
      </div>

      <div className="px-4 -mt-12 relative z-10 space-y-3">
        {installments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center text-gray-400"><p className="text-5xl mb-3">💳</p><p className="font-bold text-gray-600">Belum ada cicilan</p><p className="text-sm mt-1">Ketuk + untuk menambah cicilan</p></div>
        ) : (
          <>
            {active.map(inst => {
              const wallet = wallets.find(w => w.id === inst.walletId);
              const pct = Math.round((inst.paidCount / inst.totalCount) * 100);
              const remaining = inst.totalCount - inst.paidCount;
              return (
                <div key={inst.id} className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100">
                  <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{getIcon(inst.name)}</div>
                      <div className="flex-1 min-w-0"><p className="font-black text-gray-900 text-base truncate">{inst.name}</p><p className="text-xs text-gray-400 mt-0.5">{wallet?.name ?? '-'} · Mulai {formatDate(inst.startDate)}</p></div>
                      <button onClick={() => setDeleteId(inst.id)} className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 active:scale-90"><Trash2 size={12} className="text-gray-400" /></button>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Cicilan <span className="font-black text-gray-800">{inst.paidCount}</span>/{inst.totalCount}</span><span className="text-xs font-black text-violet-600">{pct}%</span></div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-violet-50 rounded-xl p-2.5 text-center"><p className="text-[9px] text-gray-400 font-semibold uppercase">Per Bulan</p><p className="font-black text-violet-700 text-xs mt-0.5">{formatCurrency(inst.monthlyAmount)}</p></div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-[9px] text-gray-400 font-semibold uppercase">Sisa</p><p className="font-black text-gray-700 text-xs mt-0.5">{remaining}x lagi</p></div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="text-[9px] text-gray-400 font-semibold uppercase">Total</p><p className="font-black text-gray-700 text-xs mt-0.5">{formatCurrency(inst.totalAmount)}</p></div>
                    </div>
                    <div className="flex items-center justify-between bg-violet-50 rounded-2xl px-3 py-2.5 mb-3">
                      <div className="flex items-center gap-2"><Calendar size={13} className="text-violet-500" /><span className="text-xs text-violet-700 font-medium">Bayar berikutnya</span></div>
                      <span className="text-xs font-black text-violet-700">{formatDate(getNextDate(inst.startDate, inst.paidCount))}</span>
                    </div>
                    <button onClick={() => payInstallmentMonth(inst.id)} className="w-full py-3 bg-violet-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 active:scale-95 transition-all">
                      <Zap size={14} />Bayar Bulan Ini · {formatCurrency(inst.monthlyAmount)}
                    </button>
                  </div>
                </div>
              );
            })}
            {paid.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 my-3"><CheckCircle2 size={13} className="text-emerald-500" /><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sudah Lunas</p></div>
                <div className="space-y-2">
                  {paid.map(inst => (
                    <div key={inst.id} className="bg-emerald-50 rounded-2xl border border-emerald-100 px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">{getIcon(inst.name)}</div>
                      <div className="flex-1 min-w-0"><p className="font-bold text-gray-700 text-sm truncate">{inst.name}</p><p className="text-xs text-gray-400">{inst.totalCount}x · {formatCurrency(inst.totalAmount)}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">LUNAS</span>
                        <button onClick={() => setDeleteId(inst.id)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center active:scale-90"><Trash2 size={11} className="text-gray-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => setShowModal(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/40 flex items-center justify-center z-[90] active:scale-90 transition-transform"><Plus size={24} className="text-white" /></button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Cicilan">
        <div className="space-y-4">
          <div><label className="text-xs text-gray-500 font-semibold">Nama Cicilan</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Motor, KPR, HP, Laptop..." className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-semibold" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-semibold">Cicilan/bulan</label><div className="relative mt-1.5"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span><input type="text" inputMode="numeric" value={form.monthlyAmount} onChange={e => setForm(f => ({ ...f, monthlyAmount: fmt(e.target.value) }))} placeholder="0" className="w-full pl-8 pr-3 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm font-black bg-gray-50" /></div></div>
            <div><label className="text-xs text-gray-500 font-semibold">Jumlah Bulan</label><input type="number" inputMode="numeric" value={form.totalCount} onChange={e => setForm(f => ({ ...f, totalCount: e.target.value }))} placeholder="12" min="1" className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm font-black bg-gray-50" /></div>
          </div>
          {form.monthlyAmount && form.totalCount && (
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center"><CreditCard size={14} className="text-violet-600" /></div>
              <div><p className="text-xs text-violet-500 font-semibold">Estimasi Total</p><p className="font-black text-violet-700 text-sm">{formatCurrency(parseFloat(form.monthlyAmount.replace(/\./g, '') || '0') * parseInt(form.totalCount || '0'))}</p></div>
            </div>
          )}
          <div><label className="text-xs text-gray-500 font-semibold">Dompet Pembayaran</label><select value={form.walletId} onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))} className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-semibold text-gray-700">{wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 font-semibold">Tanggal Mulai</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-medium text-gray-700" /></div>
          <button onClick={handleSubmit} disabled={!form.name || !form.monthlyAmount || !form.totalCount || !form.walletId} className="w-full py-4 bg-violet-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all">Tambah Cicilan</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteInstallment(deleteId); }} title="Hapus Cicilan?" message="Cicilan ini akan dihapus permanen dari daftar." />
    </div>
  );
}
