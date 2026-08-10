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
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: confirmDanger ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)' }}
      >
        <AlertTriangle size={28} color={confirmDanger ? '#EF4444' : '#7C3AED'} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
      </div>
      <div className="flex gap-3 w-full">
        <button className="btn-secondary flex-1" onClick={onClose} disabled={isLoading}>Cancel</button>
        <button
          className={`flex-1 ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
