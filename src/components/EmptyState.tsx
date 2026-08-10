import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`card p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(15,15,30,0.95))',
      borderColor: 'rgba(255,255,255,0.06)',
    }}
  >
    {icon && (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
        {icon}
      </div>
    )}
    <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
    {description && (
      <p className="text-sm max-w-sm mb-5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    )}
    {action && (
      <button className="btn-primary" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </motion.div>
);
