import React from 'react';
import { cn, getInitials } from '../utils/helpers';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  isGaurav?: boolean;
  style?: React.CSSProperties;
}

const sizeMap = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl' },
};

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className, isGaurav, style }) => {
  const { container, text } = sizeMap[size];
  const gradient = isGaurav
    ? 'linear-gradient(135deg, #1c69d4, #002663)'
    : 'linear-gradient(135deg, #00aaff, #005599)';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(container, 'rounded-full object-cover border border-[#00aaff]/40 shadow-[0_0_10px_rgba(0,170,255,0.3)]', className)}
        style={style}
      />
    );
  }

  return (
    <div
      className={cn(
        container,
        'rounded-full flex items-center justify-center font-bold border border-[#00aaff]/40 flex-shrink-0 shadow-[0_0_10px_rgba(0,170,255,0.25)]',
        text,
        className
      )}
      style={{
        background: gradient,
        color: 'white',
        fontFamily: 'var(--font-display)',
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
};
