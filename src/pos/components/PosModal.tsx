import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  hideClose?: boolean;
}

export default function PosModal({ open, onClose, title, children, size = 'md', hideClose = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-2',
  }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={ref}
        className={`relative w-full ${sizeClass} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col`}
        style={{ maxHeight: '92dvh' }}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            {title && (
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors active:scale-95"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
