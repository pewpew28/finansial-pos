import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Hapus', danger = true
}: Props) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
          <AlertTriangle size={22} className={danger ? 'text-red-500' : 'text-blue-500'} />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm active:scale-95 transition-transform"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-2xl font-semibold text-sm text-white active:scale-95 transition-transform ${danger ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
