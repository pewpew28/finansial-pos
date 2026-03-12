import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Delete } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginScreen() {
  const { settings, saveSettings, login } = useApp();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'create' | 'confirm' | 'name' | 'gasurl'>('enter');
  const [name, setName] = useState('');
  const [gasUrl, setGasUrl] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { if (!settings.isSetup) setStep('create'); else setStep('enter'); }, [settings.isSetup]);

  const handleNum = (n: string) => {
    setErrorMsg('');
    if (step === 'enter' || step === 'create') { if (pin.length < 6) setPin(p => p + n); }
    else if (step === 'confirm') { if (confirmPin.length < 6) setConfirmPin(p => p + n); }
  };
  const handleDel = () => {
    setErrorMsg('');
    if (step === 'enter' || step === 'create') setPin(p => p.slice(0, -1));
    else if (step === 'confirm') setConfirmPin(p => p.slice(0, -1));
  };
  const triggerShake = (msg: string) => { setShake(true); setErrorMsg(msg); setTimeout(() => setShake(false), 600); };

  useEffect(() => {
    if (step === 'enter' && pin.length === 6) {
      setTimeout(() => { const ok = login(pin); if (!ok) { triggerShake('PIN salah, coba lagi'); setPin(''); } }, 150);
    }
    if (step === 'create' && pin.length === 6) { setTimeout(() => setStep('confirm'), 150); }
    if (step === 'confirm' && confirmPin.length === 6) {
      setTimeout(() => { if (confirmPin === pin) { setStep('name'); } else { triggerShake('PIN tidak cocok'); setConfirmPin(''); } }, 150);
    }
  }, [pin, confirmPin, step]);

  const handleNameSubmit = () => { if (!name.trim()) { toast.error('Masukkan nama Anda'); return; } setStep('gasurl'); };
  const handleGasSubmit = (skip = false) => { saveSettings({ pin, userName: name.trim(), gasUrl: skip ? '' : gasUrl.trim(), isSetup: true, currency: 'IDR' }); login(pin); };
  const currentPin = step === 'confirm' ? confirmPin : pin;
  const stepInfo: Record<string, { title: string; sub: string }> = {
    enter:   { title: `Halo, ${settings.userName}!`, sub: 'Masukkan PIN untuk melanjutkan' },
    create:  { title: 'Buat PIN Baru', sub: 'PIN 6 digit untuk keamanan akun Anda' },
    confirm: { title: 'Konfirmasi PIN', sub: 'Masukkan ulang PIN yang baru dibuat' },
    name: { title: '', sub: '' }, gasurl: { title: '', sub: '' },
  };

  if (step === 'name') return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scaleIn">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 bg-white/15 rounded-3xl items-center justify-center mb-4 text-4xl">💰</div>
          <h1 className="text-3xl font-black text-white tracking-tight">FinTrack</h1>
          <p className="text-white/60 text-sm mt-1">Manajemen Keuangan Pribadi</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h2 className="text-white font-bold text-lg mb-1">Siapa nama Anda?</h2>
          <p className="text-white/60 text-sm mb-5">Nama ini akan tampil di dashboard Anda.</p>
          <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNameSubmit()} placeholder="Masukkan nama Anda" autoFocus className="w-full bg-white/15 border border-white/25 text-white placeholder-white/40 rounded-2xl px-4 py-3.5 outline-none focus:border-white/60 transition text-sm font-medium mb-4" />
          <button onClick={handleNameSubmit} className="w-full bg-white text-violet-700 font-bold rounded-2xl py-3.5 text-sm active:scale-95 transition-transform shadow-lg">Lanjutkan →</button>
        </div>
      </div>
    </div>
  );

  if (step === 'gasurl') return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scaleIn">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 bg-white/15 rounded-3xl items-center justify-center mb-4 text-4xl">📊</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Sinkronisasi</h1>
          <p className="text-white/60 text-sm mt-1">Hubungkan ke Google Sheets</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 space-y-4">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/90 text-xs font-semibold mb-2">📋 Cara Setup (opsional):</p>
            <ol className="text-white/70 text-xs space-y-1 list-decimal list-inside">
              <li>Buat Google Spreadsheet baru</li><li>Extensions → Apps Script</li>
              <li>Paste kode dari menu Pengaturan</li><li>Deploy sebagai Web App</li>
              <li>Paste URL deployment di sini</li>
            </ol>
          </div>
          <input type="url" value={gasUrl} onChange={e => setGasUrl(e.target.value)} placeholder="https://script.google.com/macros/..." className="w-full bg-white/15 border border-white/25 text-white placeholder-white/40 rounded-2xl px-4 py-3.5 outline-none focus:border-white/60 transition text-xs font-medium" />
          <button onClick={() => handleGasSubmit(false)} className="w-full bg-white text-violet-700 font-bold rounded-2xl py-3.5 text-sm active:scale-95 transition-transform shadow-lg">Mulai Sekarang 🎉</button>
          <button onClick={() => handleGasSubmit(true)} className="w-full text-white/60 text-sm py-2 font-medium">Lewati dulu</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex w-20 h-20 bg-white/15 rounded-3xl items-center justify-center mb-4 text-4xl shadow-lg">💰</div>
          <h1 className="text-3xl font-black text-white tracking-tight">FinTrack</h1>
          <p className="text-white/60 text-sm mt-1">{stepInfo[step].sub}</p>
        </div>
        <p className="text-center text-white/80 font-semibold text-base mb-8">{stepInfo[step].title}</p>
        <div className={`flex justify-center gap-4 mb-10 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`transition-all duration-200 rounded-full ${i < currentPin.length ? 'w-4 h-4 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'w-3.5 h-3.5 bg-white/25'}`} />
          ))}
        </div>
        {errorMsg && <p className="text-center text-red-300 text-sm font-medium mb-6 -mt-4">{errorMsg}</p>}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((n, idx) => {
            if (n === '') return <div key={idx} />;
            if (n === 'del') return <button key={idx} onClick={handleDel} className="h-[70px] flex items-center justify-center rounded-2xl bg-white/10 active:bg-white/25 transition-colors active:scale-90"><Delete className="w-5 h-5 text-white/80" /></button>;
            return <button key={idx} onClick={() => handleNum(n)} className="h-[70px] text-white text-2xl font-bold rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/30 transition-colors active:scale-90">{n}</button>;
          })}
        </div>
        {step === 'create' && <p className="text-center text-white/40 text-xs mt-8">Jangan berbagi PIN dengan siapapun</p>}
      </div>
    </div>
  );
}
