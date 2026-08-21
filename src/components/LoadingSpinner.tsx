import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullscreen?: boolean;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', fullscreen = false, label }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-9 h-9', lg: 'w-14 h-14' };

  const spinner = (
    <div className={`flex flex-col items-center gap-3.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`${sizes[size]} rounded-full border-2 border-white/10 border-t-[#00aaff] border-r-[#0066b1] animate-spin`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 170, 255, 0.5))' }}
        />
        <div className="absolute w-2 h-2 rounded-full bg-[#00aaff] shadow-[0_0_8px_#00aaff] animate-pulse" />
      </div>
      {label && (
        <p
          className="text-xs font-semibold uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(5, 7, 10, 0.95)', backdropFilter: 'blur(20px)' }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};
