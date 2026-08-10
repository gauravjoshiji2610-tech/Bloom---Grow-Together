import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, size = 'md', showLabel = false }) => {
  const sizes = {
    sm: { icon: 12, text: 'text-xs', pad: 'px-2 py-0.5' },
    md: { icon: 14, text: 'text-sm', pad: 'px-2.5 py-1' },
    lg: { icon: 18, text: 'text-base', pad: 'px-3 py-1.5' },
  };
  const s = sizes[size];

  const color = streak === 0
    ? 'rgba(107,104,136,0.3)'
    : streak >= 30
    ? 'rgba(245,158,11,0.2)'
    : 'rgba(239,68,68,0.2)';

  const textColor = streak === 0
    ? '#6B6888'
    : streak >= 30
    ? '#F59E0B'
    : '#F97316';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${s.pad} ${s.text}`}
      style={{ background: color, color: textColor }}
    >
      <Flame size={s.icon} fill={streak > 0 ? textColor : 'none'} />
      {streak}
      {showLabel && <span className="font-normal opacity-70">day{streak !== 1 ? 's' : ''}</span>}
    </span>
  );
};
