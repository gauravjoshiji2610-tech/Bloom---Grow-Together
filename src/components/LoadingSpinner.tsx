import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullscreen?: boolean;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', fullscreen = false, label }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full border-2 border-white/10 border-t-purple-500 animate-spin`}
        style={{ borderTopColor: '#7C3AED' }}
      />
      {label && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};
