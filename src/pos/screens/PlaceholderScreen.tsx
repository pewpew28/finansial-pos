import { Construction, ChevronLeft } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosScreen } from '../types';

interface Props {
  title: string;
  description: string;
  icon?: React.ReactNode;
  feature: string;
  backTo?: PosScreen;
}

export default function PlaceholderScreen({ title, description, icon, feature, backTo = 'dashboard' }: Props) {
  const { setScreen } = usePos();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen(backTo)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-all"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-black text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          {icon || <Construction size={40} className="text-emerald-500" />}
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{description}</p>

        <div className="w-full max-w-xs bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs font-bold text-emerald-700 mb-1">🚧 Segera Hadir</p>
          <p className="text-xs text-emerald-600 leading-relaxed">
            Fitur <strong>{feature}</strong> akan tersedia pada sesi pengembangan berikutnya.
            Konfirmasi ke developer untuk melanjutkan!
          </p>
        </div>

        <button
          onClick={() => setScreen('dashboard')}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
