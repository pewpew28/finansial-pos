import { useState, useEffect } from 'react';
import { Delete, ArrowLeft } from 'lucide-react';

interface Props {
  length?: number;
  onComplete: (pin: string) => void;
  onBack?: () => void;
  error?: string;
  clearOnError?: boolean;
  label?: string;
  sublabel?: string;
}

export default function PinPad({ length = 6, onComplete, onBack, error, clearOnError = true, label = 'Masukkan PIN', sublabel }: Props) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => { if (pin.length === length) onComplete(pin); }, [pin, length, onComplete]);

  useEffect(() => {
    if (error) {
      setShake(true);
      if (clearOnError) setPin('');
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error, clearOnError]);

  const press = (d: string) => { if (pin.length < length) setPin(p => p + d); };
  const del = () => setPin(p => p.slice(0, -1));
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">{label}</p>
        {sublabel && <p className="text-sm text-gray-500 mt-1">{sublabel}</p>}
      </div>
      <div className={`flex gap-3 transition-all ${shake ? 'animate-shake' : ''}`}>
        {Array.from({ length }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < pin.length ? 'bg-violet-600 border-violet-600 scale-110' : 'bg-transparent border-gray-300'
          }`} />
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl border border-red-100">
          <span className="text-xs font-semibold text-red-500">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} />;
          if (key === '⌫') return (
            <button key={i} onPointerDown={(e) => { e.preventDefault(); del(); }}
              className="h-16 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-700 text-xl font-bold active:scale-90 active:bg-gray-200 transition-all duration-100 shadow-sm">
              <Delete size={20} />
            </button>
          );
          return (
            <button key={i} onPointerDown={(e) => { e.preventDefault(); press(key); }}
              className="h-16 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-900 text-xl font-bold active:scale-90 active:bg-violet-50 active:border-violet-300 transition-all duration-100 shadow-sm">
              {key}
            </button>
          );
        })}
      </div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 font-semibold mt-2 active:opacity-60">
          <ArrowLeft size={14} />Kembali
        </button>
      )}
    </div>
  );
}
