import { useState } from 'react';
import {
  Users, Plus, Edit2, Trash2, Key, Crown, Shield, ShoppingBag,
  ChevronLeft, Check, Eye, EyeOff, ShieldCheck, ToggleLeft, ToggleRight,
  Clock,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosCashier, PosRole } from '../types';
import PosModal from '../components/PosModal';
import toast from 'react-hot-toast';

const AVATAR_EMOJIS = ['👤','👨','👩','🧑','👨‍💼','👩‍💼','🧑‍💼','😊','🤵','👸','🧑‍💻','👨‍🍳'];

const ROLES: { value: PosRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'owner',
    label: 'Owner',
    desc: 'Akses penuh semua fitur',
    icon: <Crown size={16} />,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    value: 'manager',
    label: 'Manager',
    desc: 'Semua kecuali hapus data & gaji',
    icon: <Shield size={16} />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    value: 'cashier',
    label: 'Kasir',
    desc: 'Transaksi & laporan shift sendiri',
    icon: <ShoppingBag size={16} />,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

interface CashierFormData {
  name: string;
  pin: string;
  pin2: string;
  role: PosRole;
  avatarEmoji: string;
  isActive: boolean;
}

const defaultForm: CashierFormData = {
  name: '',
  pin: '',
  pin2: '',
  role: 'cashier',
  avatarEmoji: '👤',
  isActive: true,
};

export default function CashiersScreen() {
  const { cashiers, addCashier, updateCashier, deleteCashier, changeCashierPin, currentCashier, setScreen } = usePos();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<PosCashier | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget] = useState<PosCashier | null>(null);
  const [form, setForm] = useState<CashierFormData>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');

  const canManage = currentCashier?.role === 'owner' || currentCashier?.role === 'manager';

  const roleInfo = (role: PosRole) => ROLES.find(r => r.value === role)!;

  const formatDate = (date: string | null) => {
    if (!date) return 'Belum pernah';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openAdd = () => {
    setForm(defaultForm);
    setEditTarget(null);
    setShowAdd(true);
  };

  const openEdit = (c: PosCashier) => {
    setForm({ name: c.name, pin: '', pin2: '', role: c.role, avatarEmoji: c.avatarEmoji, isActive: c.isActive });
    setEditTarget(c);
    setShowAdd(true);
  };

  const openPinChange = (c: PosCashier) => {
    setPinTarget(c);
    setNewPin('');
    setNewPin2('');
    setShowPinModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!editTarget) {
      // Add new
      if (form.pin.length !== 6) { toast.error('PIN harus 6 digit'); return; }
      if (form.pin !== form.pin2) { toast.error('Konfirmasi PIN tidak cocok'); return; }
      if (cashiers.length >= 10) { toast.error('Maksimal 10 kasir aktif'); return; }
      addCashier({ name: form.name, pin: form.pin, role: form.role, avatarEmoji: form.avatarEmoji, isActive: form.isActive });
    } else {
      // Edit existing
      updateCashier(editTarget.id, { name: form.name, role: form.role, avatarEmoji: form.avatarEmoji, isActive: form.isActive });
      toast.success('Data kasir diperbarui');
    }
    setShowAdd(false);
  };

  const handlePinChange = () => {
    if (!pinTarget) return;
    if (newPin.length !== 6) { toast.error('PIN harus 6 digit'); return; }
    if (newPin !== newPin2) { toast.error('Konfirmasi PIN tidak cocok'); return; }
    changeCashierPin(pinTarget.id, newPin);
    setShowPinModal(false);
  };

  const handleDelete = (c: PosCashier) => {
    if (c.id === currentCashier?.id) { toast.error('Tidak bisa hapus akun sendiri'); return; }
    deleteCashier(c.id);
  };

  const toggleActive = (c: PosCashier) => {
    if (c.id === currentCashier?.id) { toast.error('Tidak bisa menonaktifkan diri sendiri'); return; }
    updateCashier(c.id, { isActive: !c.isActive });
    toast.success(c.isActive ? 'Kasir dinonaktifkan' : 'Kasir diaktifkan');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('settings')}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Manajemen Kasir</h1>
            <p className="text-xs text-gray-400">{cashiers.length} kasir terdaftar</p>
          </div>
          {canManage && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              <Plus size={16} />
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3 flex gap-3 flex-shrink-0">
        {ROLES.map(r => {
          const count = cashiers.filter(c => c.role === r.value).length;
          return (
            <div key={r.value} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl border ${r.color}`}>
              {r.icon}
              <div>
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-base font-black leading-none">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {cashiers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={44} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold">Belum ada kasir</p>
          </div>
        ) : (
          cashiers.map(c => {
            const role = roleInfo(c.role);
            const isMe = c.id === currentCashier?.id;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${!c.isActive ? 'opacity-60' : 'border-gray-100'}`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${c.isActive ? 'bg-gradient-to-br from-emerald-50 to-teal-100' : 'bg-gray-100'}`}>
                        {c.avatarEmoji}
                      </div>
                      {isMe && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            Anda
                          </span>
                        )}
                        {!c.isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-flex items-center gap-1 ${role.color}`}>
                        {role.icon} {role.label}
                      </span>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock size={10} className="text-gray-400" />
                        <p className="text-[10px] text-gray-400">{formatDate(c.lastLogin)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => openPinChange(c)}
                          className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Key size={13} />
                        </button>
                        <button
                          onClick={() => toggleActive(c)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
                            c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {c.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                        {!isMe && c.role !== 'owner' && (
                          <button
                            onClick={() => handleDelete(c)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <PosModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editTarget ? 'Edit Kasir' : 'Tambah Kasir'}
      >
        <div className="p-5 space-y-4">
          {/* Avatar */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block">Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, avatarEmoji: e }))}
                  className={`w-10 h-10 text-2xl rounded-xl transition-all active:scale-90 ${
                    form.avatarEmoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nama Kasir</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nama lengkap"
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 outline-none border border-gray-200 focus:border-emerald-400 focus:bg-white transition-all"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block">Role</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    form.role === r.value
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className={`p-2 rounded-xl ${r.color} flex-shrink-0`}>{r.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                  {form.role === r.value && <Check size={16} className="text-emerald-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* PIN (only for new) */}
          {!editTarget && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">PIN (6 digit)</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <input
                    value={form.pin}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    placeholder="● ● ● ● ● ●"
                    className="flex-1 bg-transparent text-sm font-medium outline-none tracking-widest"
                  />
                  <button onClick={() => setShowPin(s => !s)}>
                    {showPin ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Konfirmasi PIN</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <input
                    value={form.pin2}
                    onChange={e => setForm(f => ({ ...f, pin2: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    placeholder="● ● ● ● ● ●"
                    className="flex-1 bg-transparent text-sm font-medium outline-none tracking-widest"
                  />
                </div>
                {form.pin2 && form.pin !== form.pin2 && (
                  <p className="text-xs text-red-500 font-semibold mt-1">PIN tidak cocok</p>
                )}
              </div>
            </>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-800">Status Aktif</p>
              <p className="text-xs text-gray-400">Kasir bisa login jika aktif</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`w-12 h-6 rounded-full transition-all ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${form.isActive ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
          >
            {editTarget ? 'Simpan Perubahan' : 'Tambah Kasir'}
          </button>
        </div>
      </PosModal>

      {/* ── Change PIN Modal ─────────────────────────────────────────────── */}
      <PosModal
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        title={`Ubah PIN — ${pinTarget?.name}`}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl">
            <Key size={16} className="text-amber-600" />
            <p className="text-xs text-amber-700 font-medium">Ubah PIN untuk kasir {pinTarget?.name}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">PIN Baru (6 digit)</label>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400">
              <ShieldCheck size={16} className="text-gray-400" />
              <input
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="● ● ● ● ● ●"
                className="flex-1 bg-transparent text-sm font-medium outline-none tracking-widest"
              />
              <button onClick={() => setShowPin(s => !s)}>
                {showPin ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Konfirmasi PIN Baru</label>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-emerald-400">
              <ShieldCheck size={16} className="text-gray-400" />
              <input
                value={newPin2}
                onChange={e => setNewPin2(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="● ● ● ● ● ●"
                className="flex-1 bg-transparent text-sm font-medium outline-none tracking-widest"
              />
            </div>
            {newPin2 && newPin !== newPin2 && (
              <p className="text-xs text-red-500 font-semibold mt-1">PIN tidak cocok</p>
            )}
          </div>

          <button
            onClick={handlePinChange}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all"
          >
            Simpan PIN Baru
          </button>
        </div>
      </PosModal>
    </div>
  );
}
