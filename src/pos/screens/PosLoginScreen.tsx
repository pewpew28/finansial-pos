import { useState } from 'react';
import { Store, ChevronRight, Clock } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosCashier } from '../types';
import PinPad from '../components/PinPad';

type LoginStep = 'select' | 'pin';

export default function PosLoginScreen() {
  const { cashiers, store, loginCashier } = usePos();
  const [step, setStep] = useState<LoginStep>('select');
  const [selected, setSelected] = useState<PosCashier | null>(null);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  const activeCashiers = cashiers.filter(c => c.isActive);

  const handleSelect = (cashier: PosCashier) => {
    setSelected(cashier);
    setError('');
    setStep('pin');
  };

  const handlePin = (pin: string) => {
    if (!selected) return;
    const ok = loginCashier(selected.id, pin);
    if (!ok) {
      setError('PIN salah, coba lagi');
      setErrorKey(k => k + 1);
    }
  };

  const roleBadge = (role: PosCashier['role']) => {
    const map = {
      owner: { label: 'Owner', color: 'bg-amber-100 text-amber-700' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
      cashier: { label: 'Kasir', color: 'bg-emerald-100 text-emerald-700' },
    };
    return map[role];
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Belum pernah login';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pt-14 pb-8 px-6 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          {store.logoBase64 ? (
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 ring-4 ring-white/20">
              <img src={store.logoBase64} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 ring-4 ring-white/10 backdrop-blur-sm">
              <Store size={36} className="text-white" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {store.name || 'FinPOS'}
        </h1>
        <p className="text-emerald-200 text-sm mt-1 font-medium">
          {step === 'select' ? 'Pilih kasir untuk login' : `Halo, ${selected?.name}!`}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-t-[2rem] shadow-2xl overflow-hidden">
        <div
          className="overflow-y-auto"
          style={{ height: 'calc(100dvh - 240px)' }}
        >
          {/* ── Select Cashier ────────────────────────────────────────────── */}
          {step === 'select' && (
            <div className="p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {activeCashiers.length} Kasir Aktif
              </p>

              {activeCashiers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Store size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Belum ada kasir</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCashiers.map(cashier => {
                    const badge = roleBadge(cashier.role);
                    return (
                      <button
                        key={cashier.id}
                        onClick={() => handleSelect(cashier)}
                        className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.98] transition-all group shadow-sm"
                      >
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                          {cashier.avatarEmoji}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm">{cashier.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={11} className="text-gray-400" />
                            <p className="text-xs text-gray-400">{formatLastLogin(cashier.lastLogin)}</p>
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PIN Entry ─────────────────────────────────────────────────── */}
          {step === 'pin' && selected && (
            <div className="p-6">
              {/* Selected cashier preview */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/20">
                  {selected.avatarEmoji}
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-lg">{selected.name}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${roleBadge(selected.role).color}`}>
                    {roleBadge(selected.role).label}
                  </span>
                </div>
              </div>

              <PinPad
                key={errorKey}
                onComplete={handlePin}
                onBack={() => { setStep('select'); setError(''); }}
                error={error}
                label="Masukkan PIN Anda"
                sublabel={`Login sebagai ${selected.name}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
