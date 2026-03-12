import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogOut, RefreshCw, Link2, Lock, ChevronRight,
  Info, Copy, CheckCheck, ShieldCheck, MessageCircle, FileSpreadsheet,
} from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';



const GAS_CODE = `// ==========================================
// FinTrack — Google Apps Script Backend
// Paste ke: script.google.com (New Project)
// Buat dari Google Spreadsheet baru:
// Extensions → Apps Script → paste kode ini
// Deploy: Deploy → New Deployment → Web App
// Who has access: Anyone
// ==========================================

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getAll') {
    return json({
      wallets:      getData('Wallets'),
      transactions: getData('Transactions'),
      debts:        getData('Debts'),
      installments: getData('Installments'),
    });
  }
  return ContentService.createTextOutput('FinTrack API v1.0 ✅');
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  try {
    if      (d.action === 'addWallet')          appendRow('Wallets', d.wallet);
    else if (d.action === 'updateWallet')       updateRow('Wallets', d.id, d.data);
    else if (d.action === 'deleteWallet')       deleteRow('Wallets', d.id);
    else if (d.action === 'addTransaction')     appendRow('Transactions', d.transaction);
    else if (d.action === 'deleteTransaction')  deleteRow('Transactions', d.id);
    else if (d.action === 'addDebt')            appendRow('Debts', d.debt);
    else if (d.action === 'updateDebt')         updateRow('Debts', d.id, d.data);
    else if (d.action === 'deleteDebt')         deleteRow('Debts', d.id);
    else if (d.action === 'addInstallment')     appendRow('Installments', d.installment);
    else if (d.action === 'updateInstallment')  updateRow('Installments', d.id, d.data);
    else if (d.action === 'deleteInstallment')  deleteRow('Installments', d.id);
    else if (d.action === 'payInstallmentMonth') payInstMonth(d.id);
    return json({ status: 'ok' });
  } catch(err) {
    return json({ status: 'error', msg: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function getData(name) {
  const s    = getSheet(name);
  const data = s.getDataRange().getValues();
  if (data.length < 2) return [];
  const h = data[0];
  return data.slice(1).map(r => {
    const o = {};
    h.forEach((k, i) => o[k] = r[i]);
    return o;
  });
}

function appendRow(name, obj) {
  const s    = getSheet(name);
  const keys = Object.keys(obj);
  if (s.getLastRow() === 0) s.appendRow(keys);
  const h = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  s.appendRow(h.map(k => obj[k] ?? ''));
}

function updateRow(name, id, updates) {
  const s    = getSheet(name);
  const data = s.getDataRange().getValues();
  const h    = data[0];
  const idC  = h.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idC] === id) {
      Object.keys(updates).forEach(k => {
        const c = h.indexOf(k);
        if (c >= 0) s.getRange(i+1, c+1).setValue(updates[k]);
      });
      return;
    }
  }
}

function deleteRow(name, id) {
  const s    = getSheet(name);
  const data = s.getDataRange().getValues();
  const h    = data[0];
  const idC  = h.indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idC] === id) { s.deleteRow(i+1); return; }
  }
}

function payInstMonth(id) {
  const s    = getSheet('Installments');
  const data = s.getDataRange().getValues();
  const h    = data[0];
  const idC  = h.indexOf('id');
  const pC   = h.indexOf('paidCount');
  const tC   = h.indexOf('totalCount');
  const stC  = h.indexOf('status');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idC] === id) {
      const np = (data[i][pC] || 0) + 1;
      s.getRange(i+1, pC+1).setValue(np);
      if (np >= data[i][tC]) s.getRange(i+1, stC+1).setValue('paid');
      return;
    }
  }
}`;

interface MenuItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  badge?: string;
}

function MenuItem({ icon, iconBg, title, subtitle, onClick, badge }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>
      </div>
      {badge && (
        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold mr-1">{badge}</span>
      )}
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

export default function SettingsScreen() {
  const { settings, saveSettings, logout, syncData, isSyncing, lastSync } = useApp();
  const [showPinModal, setShowPinModal]   = useState(false);
  const [showGasModal, setShowGasModal]   = useState(false);
  const [showGasCode, setShowGasCode]     = useState(false);
  const [pinForm, setPinForm]             = useState({ current: '', new: '', confirm: '' });
  const [gasUrl, setGasUrl]               = useState(settings.gasUrl);
  const [userName, setUserName]           = useState(settings.userName);
  const [copied, setCopied]               = useState(false);
  const [nameSaved, setNameSaved]         = useState(false);

  const handleChangePIN = () => {
    if (pinForm.current !== settings.pin)  { toast.error('PIN lama salah'); return; }
    if (pinForm.new.length < 6)            { toast.error('PIN baru minimal 6 digit'); return; }
    if (pinForm.new !== pinForm.confirm)   { toast.error('Konfirmasi PIN tidak cocok'); return; }
    saveSettings({ pin: pinForm.new });
    setShowPinModal(false);
    setPinForm({ current: '', new: '', confirm: '' });
    toast.success('PIN berhasil diubah');
  };

  const handleSaveGas = () => {
    saveSettings({ gasUrl: gasUrl.trim() });
    setShowGasModal(false);
    toast.success('URL GAS disimpan');
  };

  const handleSaveName = () => {
    if (!userName.trim()) return;
    saveSettings({ userName: userName.trim() });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
    toast.success('Nama diperbarui');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(GAS_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('Kode disalin!');
    });
  };

  const syncStatus = lastSync
    ? `Terakhir: ${new Date(lastSync).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`
    : 'Belum pernah sinkronisasi';

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 px-5 pt-14 pb-20">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <h1 className="text-white text-xl font-black">Pengaturan</h1>
        <p className="text-white/50 text-xs mt-0.5">Kelola akun & preferensi</p>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="font-black text-gray-900 text-lg bg-transparent outline-none w-full border-b-2 border-transparent focus:border-violet-400 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-0.5">Ketuk nama untuk mengedit</p>
            </div>
            {nameSaved && (
              <CheckCheck size={16} className="text-emerald-500 flex-shrink-0 animate-scaleIn" />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Security */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keamanan</p>
          </div>
          <MenuItem
            icon={<Lock size={16} className="text-violet-600" />}
            iconBg="bg-violet-50"
            title="Ubah PIN"
            subtitle="Keamanan akses aplikasi"
            onClick={() => setShowPinModal(true)}
          />
        </div>

        {/* Sync */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Sheets Sync</p>
          </div>
          <MenuItem
            icon={<Link2 size={16} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="URL Apps Script"
            subtitle={settings.gasUrl ? '✅ Sudah terhubung' : '⚠️ Belum diset'}
            onClick={() => setShowGasModal(true)}
            badge={settings.gasUrl ? 'Connected' : undefined}
          />
          <div className="border-t border-gray-50">
            <MenuItem
              icon={<RefreshCw size={16} className={`text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />}
              iconBg="bg-blue-50"
              title="Sinkronisasi Sekarang"
              subtitle={syncStatus}
              onClick={syncData}
            />
          </div>
          <div className="border-t border-gray-50">
            <MenuItem
              icon={<ShieldCheck size={16} className="text-purple-600" />}
              iconBg="bg-purple-50"
              title="Kode Apps Script"
              subtitle="Copy-paste ke Google Apps Script"
              onClick={() => setShowGasCode(true)}
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fitur Lainnya</p>
          </div>
          <MenuItem
            icon={<MessageCircle size={16} className="text-green-600" />}
            iconBg="bg-green-50"
            title="Notifikasi WhatsApp"
            subtitle="Setup Fonte & kirim pengingat"
            onClick={() => toast('Buka tab WA Notif di menu bawah', { icon: '💬' })}
            badge="Fonte"
          />
          <div className="border-t border-gray-50">
            <MenuItem
              icon={<FileSpreadsheet size={16} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title="Export Laporan Excel"
              subtitle="Download laporan .xlsx lengkap"
              onClick={() => toast('Buka tab Export di menu bawah', { icon: '📊' })}
              badge="xlsx"
            />
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">FinTrack v1.0</p>
              <p className="text-xs text-gray-400">Manajemen Keuangan Pribadi</p>
            </div>
            <div className="ml-auto">
              <Info size={14} className="text-gray-300" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-red-50 border border-red-100 text-red-500 rounded-3xl font-black text-sm active:scale-95 transition-transform"
        >
          <LogOut size={16} />
          Keluar dari Akun
        </button>
      </div>

      {/* ── Change PIN Modal ── */}
      <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title="Ubah PIN">
        <div className="space-y-4">
          {([
            { label: 'PIN Lama', key: 'current' as const },
            { label: 'PIN Baru (6 digit)', key: 'new' as const },
            { label: 'Konfirmasi PIN Baru', key: 'confirm' as const },
          ]).map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 font-semibold">{f.label}</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm[f.key]}
                onChange={e => setPinForm(p => ({ ...p, [f.key]: e.target.value.replace(/\D/g, '') }))}
                placeholder="••••••"
                className="w-full mt-1.5 px-4 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-center tracking-[0.5em] text-xl font-black bg-gray-50"
              />
            </div>
          ))}
          <button
            onClick={handleChangePIN}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-500/30 active:scale-95 transition-all"
          >
            Simpan PIN Baru
          </button>
        </div>
      </Modal>

      {/* ── GAS URL Modal ── */}
      <Modal isOpen={showGasModal} onClose={() => setShowGasModal(false)} title="Google Apps Script URL">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-700 font-black mb-2">📋 Cara Setup:</p>
            <ol className="text-xs text-blue-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Buat Google Spreadsheet baru</li>
              <li>Buka <strong>Extensions → Apps Script</strong></li>
              <li>Copy kode dari menu "Kode Apps Script"</li>
              <li>Klik <strong>Deploy → New deployment → Web App</strong></li>
              <li>Set "Who has access" = <strong>Anyone</strong></li>
              <li>Copy URL dan paste di bawah ini</li>
            </ol>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">URL Deployment</label>
            <input
              type="url"
              value={gasUrl}
              onChange={e => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50"
            />
          </div>
          <button
            onClick={handleSaveGas}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
          >
            Simpan URL
          </button>
        </div>
      </Modal>

      {/* ── GAS Code Modal ── */}
      <Modal isOpen={showGasCode} onClose={() => setShowGasCode(false)} title="Kode Google Apps Script">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Copy seluruh kode di bawah ini, lalu paste ke Google Apps Script Editor.
          </p>
          <div className="bg-slate-900 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-[10px] ml-2 font-mono">Code.gs</span>
            </div>
            <div className="overflow-auto max-h-56">
              <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap font-mono leading-relaxed">{GAS_CODE}</pre>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
            }`}
          >
            {copied ? <><CheckCheck size={16} /> Berhasil Disalin!</> : <><Copy size={16} /> Salin Kode</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
