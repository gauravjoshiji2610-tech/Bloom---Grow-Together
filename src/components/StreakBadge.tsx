import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, size = 'md', showLabel = false }) => {
  const sizes = {
    sm: { icon: 11, text: 'text-[11px]', pad: 'px-2 py-0.5' },
    md: { icon: 13, text: 'text-xs', pad: 'px-2.5 py-1' },
    lg: { icon: 16, text: 'text-sm', pad: 'px-3.5 py-1.5' },
  };
  const s = sizes[size];

  const color = streak === 0
    ? 'rgba(94,104,120,0.2)'
    : streak >= 30
    ? 'rgba(245,158,11,0.2)'
    : 'rgba(249,115,22,0.2)';

  const borderColor = streak === 0
    ? 'rgba(255,255,255,0.06)'
    : streak >= 30
    ? 'rgba(245,158,11,0.4)'
    : 'rgba(249,115,22,0.4)';

  const textColor = streak === 0
    ? '#5e6878'
    : streak >= 30
    ? '#f59e0b'
    : '#f97316';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold border tracking-wider ${s.pad} ${s.text}`}
      style={{
        background: color,
        borderColor: borderColor,
        color: textColor,
        fontFamily: 'var(--font-mono)',
        boxShadow: streak > 0 ? `0 0 10px ${color}` : 'none',
      }}
    >
      <Flame size={s.icon} fill={streak > 0 ? textColor : 'none'} />
      {streak}
      {showLabel && <span className="font-normal opacity-75">day{streak !== 1 ? 's' : ''}</span>}
    </span>
  );
};
