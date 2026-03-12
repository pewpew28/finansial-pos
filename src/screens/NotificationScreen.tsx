import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WaNotificationConfig } from '../types';
import {
  MessageCircle, Bell, Send, TestTube2,
  CheckCircle2, XCircle, Loader2,
  PhoneCall, Key, Calendar, FileText, AlertCircle,
  ToggleLeft, ToggleRight, Info, Zap
} from 'lucide-react';
import { sendDueDateReminder, sendDailyReport, sendTestMessage } from '../utils/whatsapp';
import toast from 'react-hot-toast';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NotificationScreen() {
  const { settings, saveSettings, debts, installments, transactions } = useApp();
  const [config, setConfig] = useState<WaNotificationConfig>(settings.waNotif);
  const [sendStatus, setSendStatus] = useState<Record<string, Status>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const update = (patch: Partial<WaNotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    saveSettings({ waNotif: config });
    setHasChanges(false);
    toast.success('Pengaturan notifikasi disimpan!');
  };

  const setStatus = (key: string, s: Status) =>
    setSendStatus(prev => ({ ...prev, [key]: s }));

  const handleTest = async () => {
    setStatus('test', 'loading');
    const res = await sendTestMessage(config, settings.userName);
    setStatus('test', res.success ? 'success' : 'error');
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setTimeout(() => setStatus('test', 'idle'), 4000);
  };

  const handleSendReminder = async () => {
    setStatus('reminder', 'loading');
    const res = await sendDueDateReminder(config, debts, installments, settings.userName);
    setStatus('reminder', res.success ? 'success' : 'error');
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setTimeout(() => setStatus('reminder', 'idle'), 4000);
  };

  const handleSendDaily = async () => {
    setStatus('daily', 'loading');
    const res = await sendDailyReport(config, transactions, settings.userName);
    setStatus('daily', res.success ? 'success' : 'error');
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setTimeout(() => setStatus('daily', 'idle'), 4000);
  };

  const BtnIcon = ({ s }: { s: Status }) => {
    if (s === 'loading') return <Loader2 size={15} className="animate-spin" />;
    if (s === 'success') return <CheckCircle2 size={15} />;
    if (s === 'error')   return <XCircle size={15} />;
    return null;
  };

  const btnColor = (s: Status, base: string) => {
    if (s === 'success') return 'bg-emerald-500 text-white';
    if (s === 'error')   return 'bg-red-500 text-white';
    return base;
  };

  const pendingDebts = debts.filter(d => !d.isPaid && d.dueDate).length;
  const activeInst   = installments.filter(i => i.status === 'active').length;
  const todayTx      = transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 px-5 pt-14 pb-24">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">WhatsApp</span>
            </div>
            <h1 className="text-white text-2xl font-black">Notifikasi</h1>
            <p className="text-white/60 text-xs mt-1">via Fonnte API</p>
          </div>
          {/* Toggle utama */}
          <button
            onClick={() => update({ enabled: !config.enabled })}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
              config.enabled ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'
            }`}
          >
            {config.enabled
              ? <><ToggleRight size={18} /> Aktif</>
              : <><ToggleLeft size={18} /> Nonaktif</>}
          </button>
        </div>

        {/* Stats row */}
        <div className="relative mt-5 flex gap-3">
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-[10px] font-semibold">Jatuh Tempo</p>
            <p className="text-white font-black text-xl">{pendingDebts}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-[10px] font-semibold">Cicilan Aktif</p>
            <p className="text-white font-black text-xl">{activeInst}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-[10px] font-semibold">Transaksi Hari Ini</p>
            <p className="text-white font-black text-xl">{todayTx}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-10 space-y-4">

        {/* ── Fonte API Setup Card ───────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <Key size={15} className="text-green-600" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">Konfigurasi Fonnte</p>
                  <p className="text-[10px] text-gray-400">fonnte.com</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-green-600 font-bold flex items-center gap-1"
              >
                <Info size={12} />
                {showGuide ? 'Tutup' : 'Cara dapat Token'}
              </button>
            </div>
          </div>

          {/* Guide */}
          {showGuide && (
            <div className="mx-4 my-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-black text-amber-800 mb-2">📋 Cara Mendapatkan Token Fonnte:</p>
              <ol className="text-xs text-amber-700 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Buka <strong>fonnte.com</strong> → Daftar / Login</li>
                <li>Klik <strong>"Connect Device"</strong> di dashboard</li>
                <li>Scan QR code dengan WhatsApp Anda</li>
                <li>Setelah terhubung, klik nama device</li>
                <li>Copy <strong>Token</strong> yang tertera di halaman device</li>
                <li>Paste Token di field di bawah ini</li>
              </ol>
              <div className="mt-3 bg-amber-100 rounded-xl px-3 py-2 space-y-1">
                <p className="text-[10px] text-amber-700 font-semibold">⚡ Fonnte menawarkan 1.000 pesan gratis/bulan untuk akun baru</p>
                <p className="text-[10px] text-amber-600">💡 Token berbeda dengan password akun — Token ada di halaman detail device</p>
              </div>
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Token */}
            <div>
              <label className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-1.5">
                <Key size={11} className="text-gray-400" />
                Fonnte Token
              </label>
              <input
                type="password"
                value={config.fonteApiKey}
                onChange={e => update({ fonteApiKey: e.target.value })}
                placeholder="Paste Token dari halaman device Fonnte"
                className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-400 text-sm bg-gray-50 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1 ml-1">Token tersedia di dashboard Fonnte → Device → pilih device Anda</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-1.5">
                <PhoneCall size={11} className="text-gray-400" />
                Nomor WhatsApp Tujuan
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">+</span>
                <input
                  type="tel"
                  value={config.phoneNumber}
                  onChange={e => update({ phoneNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="6281234567890"
                  className="w-full pl-8 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-400 text-sm bg-gray-50 font-mono"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-1">Format: 628xxx (tanpa + atau spasi)</p>
            </div>

            {/* Reminder days */}
            <div>
              <label className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-1.5">
                <Calendar size={11} className="text-gray-400" />
                Ingatkan H- (hari sebelum jatuh tempo)
              </label>
              <div className="flex gap-2">
                {[1, 3, 5, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => update({ reminderDaysBefore: d })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${
                      config.reminderDaysBefore === d
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification Preferences ──────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Jenis Notifikasi</p>
          </div>

          {/* Debt reminder */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Pengingat Piutang & Utang</p>
              <p className="text-xs text-gray-400 mt-0.5">Notifikasi jatuh tempo & keterlambatan</p>
            </div>
            <button
              onClick={() => update({ notifyDebt: !config.notifyDebt })}
              className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 relative ${
                config.notifyDebt ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                config.notifyDebt ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Installment reminder */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Pengingat Cicilan</p>
              <p className="text-xs text-gray-400 mt-0.5">Info cicilan aktif bulanan</p>
            </div>
            <button
              onClick={() => update({ notifyInstallment: !config.notifyInstallment })}
              className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 relative ${
                config.notifyInstallment ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                config.notifyInstallment ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Daily report */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Laporan Harian</p>
              <p className="text-xs text-gray-400 mt-0.5">Ringkasan transaksi hari ini</p>
            </div>
            <button
              onClick={() => update({ notifyDailyReport: !config.notifyDailyReport })}
              className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 relative ${
                config.notifyDailyReport ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                config.notifyDailyReport ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* ── Save Changes ──────────────────────────── */}
        {hasChanges && (
          <button
            onClick={saveConfig}
            className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Simpan Pengaturan
          </button>
        )}

        {/* ── Send Actions ──────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Kirim Sekarang</p>
          </div>

          {/* Test */}
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <TestTube2 size={15} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Test Koneksi</p>
                <p className="text-xs text-gray-400">Kirim pesan test ke WhatsApp Anda</p>
              </div>
            </div>
            <button
              onClick={handleTest}
              disabled={sendStatus.test === 'loading' || !config.fonteApiKey || !config.phoneNumber}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                btnColor(sendStatus.test, 'bg-blue-500 text-white shadow-lg shadow-blue-500/20')
              }`}
            >
              <BtnIcon s={sendStatus.test} />
              {sendStatus.test === 'loading' ? 'Mengirim...' :
               sendStatus.test === 'success' ? 'Berhasil Dikirim!' :
               sendStatus.test === 'error'   ? 'Gagal Kirim' :
               <><Send size={14} /> Kirim Test</>}
            </button>
          </div>

          {/* Reminder */}
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <Bell size={15} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Kirim Pengingat</p>
                <p className="text-xs text-gray-400">Jatuh tempo utang & cicilan aktif</p>
              </div>
            </div>
            <button
              onClick={handleSendReminder}
              disabled={sendStatus.reminder === 'loading' || !config.fonteApiKey || !config.phoneNumber}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                btnColor(sendStatus.reminder, 'bg-orange-500 text-white shadow-lg shadow-orange-500/20')
              }`}
            >
              <BtnIcon s={sendStatus.reminder} />
              {sendStatus.reminder === 'loading' ? 'Mengirim...' :
               sendStatus.reminder === 'success' ? 'Berhasil Dikirim!' :
               sendStatus.reminder === 'error'   ? 'Gagal Kirim' :
               <><Zap size={14} /> Kirim Pengingat Sekarang</>}
            </button>
          </div>

          {/* Daily Report */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                <FileText size={15} className="text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Kirim Laporan Harian</p>
                <p className="text-xs text-gray-400">Ringkasan transaksi hari ini</p>
              </div>
            </div>
            <button
              onClick={handleSendDaily}
              disabled={sendStatus.daily === 'loading' || !config.fonteApiKey || !config.phoneNumber}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                btnColor(sendStatus.daily, 'bg-violet-600 text-white shadow-lg shadow-violet-500/20')
              }`}
            >
              <BtnIcon s={sendStatus.daily} />
              {sendStatus.daily === 'loading' ? 'Mengirim...' :
               sendStatus.daily === 'success' ? 'Berhasil Dikirim!' :
               sendStatus.daily === 'error'   ? 'Gagal Kirim' :
               <><Send size={14} /> Kirim Laporan</>}
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${
          config.enabled && config.fonteApiKey && config.phoneNumber
            ? 'bg-green-50 border border-green-100'
            : 'bg-amber-50 border border-amber-100'
        }`}>
          {config.enabled && config.fonteApiKey && config.phoneNumber ? (
            <>
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700 font-semibold">Token Fonnte terkonfigurasi & siap mengirim notifikasi</p>
            </>
          ) : (
            <>
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                {!config.fonteApiKey ? 'Token Fonnte belum diisi' :
                 !config.phoneNumber ? 'Nomor HP belum diisi' :
                 'Notifikasi dinonaktifkan'}
              </p>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
              <MessageCircle size={15} className="text-green-400" />
            </div>
            <p className="font-black text-white text-sm">Tentang Fonnte</p>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed mb-3">
            Fonnte adalah layanan WhatsApp API yang memungkinkan pengiriman pesan otomatis menggunakan nomor WA pribadi Anda. FinTrack menggunakan Fonnte untuk notifikasi langsung ke WhatsApp.
          </p>
          <div className="space-y-1.5">
            {[
              '✅ Gratis hingga 1.000 pesan/bulan',
              '✅ Setup mudah — cukup scan QR sekali',
              '✅ Gunakan nomor WhatsApp sendiri',
              '✅ Token ada di halaman detail Device',
            ].map((item, i) => (
              <p key={i} className="text-xs text-slate-400">{item}</p>
            ))}
          </div>
          <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 space-y-1">
            <p className="text-xs text-slate-300 font-mono">🌐 fonnte.com</p>
            <p className="text-[10px] text-slate-400">Dashboard → Device → klik device → salin Token</p>
          </div>
        </div>

      </div>
    </div>
  );
}
