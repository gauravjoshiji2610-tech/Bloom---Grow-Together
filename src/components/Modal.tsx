import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 450 }}
            className={`relative w-full ${sizeMap[size]} glass-strong rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden max-h-[90vh] overflow-y-auto ${className}`}
            style={{
              background: 'rgba(14, 19, 28, 0.96)',
              border: '1px solid rgba(0, 170, 255, 0.3)',
              boxShadow: '0 0 40px rgba(0, 102, 177, 0.25), 0 25px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <h2
                  className="text-base font-bold tracking-wide text-white uppercase"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  aria-label="Close modal"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] z-10"
                aria-label="Close modal"
              >
                <X size={17} />
              </button>
            )}
            <div className={title ? 'p-6' : 'p-6 pt-10'}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
