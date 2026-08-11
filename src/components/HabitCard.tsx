import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Archive, Edit3, Trash2, RotateCcw, MoreVertical, Star, RefreshCw } from 'lucide-react';
import type { HabitWithLog } from '../types';
import { getCategoryLabel, getDayName, formatRelativeTime } from '../utils/helpers';
import { StreakBadge } from './StreakBadge';
import { LinkifiedText } from './LinkifiedText';

interface HabitCardProps {
  habit: HabitWithLog;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (habit: HabitWithLog) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore?: (id: string) => void;
  isCompleting?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onUndo,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  isCompleting,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCompleted = habit.todayLog?.completed ?? false;

  const priorityColors: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  const scheduleText = (() => {
    if (habit.recurrence?.enabled) {
      const { frequency, interval, weekDays, monthDay } = habit.recurrence;
      if (frequency === 'daily') {
        return interval === 1 ? 'Every day' : `Every ${interval} days`;
      }
      if (frequency === 'weekly') {
        const dayNames = weekDays.map(d => getDayName(d, true)).join(', ');
        return interval === 1 ? dayNames : `Every ${interval}w — ${dayNames}`;
      }
      if (frequency === 'monthly') {
        return interval === 1 ? `Monthly on ${monthDay}` : `Every ${interval} months on ${monthDay}`;
      }
    }
    // Legacy fallback
    return habit.repeatType === 'daily'
      ? 'Every day'
      : habit.selectedDays.map(d => getDayName(d, true)).join(', ');
  })();

  const showRecurrenceBadge = habit.recurrence?.enabled && habit.recurrence.interval > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`card relative transition-all duration-300 overflow-hidden ${
        habit.isArchived ? 'opacity-60' : 'card-hover'
      }`}
      style={{
        borderColor: isCompleted ? `${habit.color}40` : undefined,
        background: isCompleted ? `linear-gradient(135deg, ${habit.color}08, #1A1A2E)` : undefined,
      }}
    >
      {/* Priority indicator */}
      <div
        className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl"
        style={{ background: priorityColors[habit.priority] }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-3.5">
          {/* Complete button */}
          <button
            onClick={() => isCompleted ? onUndo(habit.id) : onComplete(habit.id)}
            disabled={isCompleting || habit.isArchived}
            className="flex-shrink-0 mt-0.5 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={isCompleted ? 'Undo completion' : 'Mark complete'}
          >
            <motion.div
              key={isCompleted ? 'completed' : 'uncompleted'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            >
              {isCompleted ? (
                <CheckCircle2 size={26} style={{ color: habit.color }} fill={habit.color} />
              ) : (
                <Circle size={26} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </motion.div>
          </button>

          {/* Habit info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{habit.icon}</span>
              <h3
                className={`font-bold text-base truncate ${
                  isCompleted ? 'line-through opacity-60 text-gray-300' : 'text-white'
                }`}
              >
                {habit.name}
              </h3>
              {habit.priority === 'high' && (
                <Star size={13} fill={priorityColors.high} style={{ color: priorityColors.high, flexShrink: 0 }} />
              )}
            </div>

            {habit.description && (
              <p className="text-xs mb-2 text-gray-400 line-clamp-2 leading-relaxed">
                <LinkifiedText text={habit.description} />
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="badge badge-purple">{getCategoryLabel(habit.category)}</span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={11} />
                {habit.time}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {showRecurrenceBadge && <RefreshCw size={10} />}
                {scheduleText}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-2">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="btn-ghost p-1.5 rounded-lg"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-8 z-20 w-44 rounded-xl border shadow-2xl overflow-hidden glass-strong"
                  style={{ background: '#1A1A2E', borderColor: 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => { onEdit(habit); setMenuOpen(false); }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  {habit.isArchived ? (
                    onRestore && (
                      <button
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"
                        style={{ color: '#10B981' }}
                        onClick={() => { onRestore(habit.id); setMenuOpen(false); }}
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                    )
                  ) : (
                    <button
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onClick={() => { onArchive(habit.id); setMenuOpen(false); }}
                    >
                      <Archive size={14} /> Archive
                    </button>
                  )}
                  <button
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors"
                    style={{ color: '#EF4444' }}
                    onClick={() => { onDelete(habit.id); setMenuOpen(false); }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
            <StreakBadge streak={habit.streak} size="sm" />
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              {habit.completionRate}% rate
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${habit.completionRate}%`,
              background: `linear-gradient(90deg, ${habit.color}80, ${habit.color})`,
            }}
          />
        </div>

        {/* Completed time */}
        {isCompleted && habit.todayLog?.completedAt && (
          <div className="mt-2 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Completed {formatRelativeTime(habit.todayLog.completedAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
};
