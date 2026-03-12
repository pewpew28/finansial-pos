import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
}

export default function Modal({ isOpen, onClose, title, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      scrollRef.current?.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-lg animate-slideUp flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 relative z-10">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Modal container */}
        <div className="bg-white rounded-t-3xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(92vh - 16px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
            >
              <X size={15} />
            </button>
          </div>
          {/* Scrollable content */}
          <div ref={scrollRef} className="overflow-y-auto flex-1 px-5 py-4 pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
