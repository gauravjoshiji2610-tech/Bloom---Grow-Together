import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmDanger = false, isLoading = false
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center border"
        style={{
          background: confirmDanger ? 'rgba(225,6,0,0.15)' : 'rgba(0,102,177,0.2)',
          borderColor: confirmDanger ? 'rgba(225,6,0,0.4)' : 'rgba(0,170,255,0.4)',
        }}
      >
        <AlertTriangle size={24} color={confirmDanger ? '#e10600' : '#00aaff'} />
      </div>
      <div>
        <h3
          className="text-base font-bold uppercase tracking-wider mb-1.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
        >
          {title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 w-full mt-2">
        <button className="btn-secondary flex-1 justify-center" onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
        <button
          className={`flex-1 justify-center ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
