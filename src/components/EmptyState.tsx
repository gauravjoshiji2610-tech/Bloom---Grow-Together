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
    className={`card p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    style={{
      background: 'rgba(14, 20, 30, 0.88)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    }}
  >
    {icon && (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 border"
        style={{
          background: 'rgba(0, 102, 177, 0.15)',
          borderColor: 'rgba(0, 170, 255, 0.3)',
          boxShadow: '0 0 20px rgba(0, 170, 255, 0.15)',
        }}
      >
        {icon}
      </div>
    )}
    <h3
      className="text-base font-bold text-white mb-1.5 uppercase tracking-wide"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {title}
    </h3>
    {description && (
      <p className="text-xs max-w-xs mb-5 leading-relaxed text-gray-400">
        {description}
      </p>
    )}
    {action && (
      <button className="btn-primary text-xs" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </motion.div>
);
