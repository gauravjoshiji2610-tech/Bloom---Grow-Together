import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { activityService } from '../services/activityService';
import { Avatar } from '../components/Avatar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { GAURAV_ID } from '../data/mockData';
import { formatRelativeTime } from '../utils/helpers';
import type { ActivityEvent } from '../types';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

import { containerVariants, itemVariantsX as itemVariants } from '../utils/variants';

function getEventIcon(type: string): string {
  const map: Record<string, string> = {
    habit_completed: '✅',
    habit_undone: '↩️',
    habit_created: '🌱',
    habit_edited: '✏️',
    habit_archived: '📦',
    habit_restored: '♻️',
    partner_nudge: '👋',
    partner_cheer: '🎉',
    partner_message: '💬',
    streak_milestone: '🔥',
    profile_updated: '👤',
  };
  return map[type] || '•';
}

function getEventColor(type: string): string {
  if (type === 'habit_completed') return '#10B981';
  if (type === 'streak_milestone') return '#F59E0B';
  if (type.startsWith('partner_')) return '#EC4899';
  if (type === 'habit_created') return '#8B5CF6';
  return '#71717A';
}

function getDateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function groupByDay(events: ActivityEvent[]): Array<{ date: string; label: string; events: ActivityEvent[] }> {
  const map = new Map<string, ActivityEvent[]>();
  events.forEach(event => {
    const day = event.createdAt.split('T')[0];
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(event);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, evts]) => ({
      date,
      label: getDateLabel(date + 'T12:00:00Z'),
      events: evts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
}

const activityTypeLabel: Record<string, string> = {
  habit_completed: 'completed',
  habit_undone: 'undid completion of',
  habit_created: 'created habit',
  habit_edited: 'updated',
  habit_archived: 'archived',
  habit_restored: 'restored',
  partner_nudge: 'sent a nudge',
  partner_cheer: 'sent a cheer',
  partner_message: 'sent a message',
  streak_milestone: 'hit a streak milestone!',
  profile_updated: 'updated profile',
};

export const ActivityPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine' | 'partner'>('all');

  useEffect(() => {
    loadActivity();
  }, [currentUser?.uid]);

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      const all = await activityService.getActivity(50);
      setEvents(all);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = events.filter(event => {
    if (filter === 'mine') return event.actorId === currentUser?.uid;
    if (filter === 'partner') return event.actorId !== currentUser?.uid;
    return true;
  });

  const grouped = groupByDay(filtered);

  if (isLoading) return <LoadingSpinner fullscreen label="Loading activity feed..." />;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title mb-1">Activity Feed</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Realtime history of habit completion and actions</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Activity' },
          { key: 'mine', label: 'My Actions' },
          { key: 'partner', label: 'Partner Actions' },
        ].map(f => (
          <button
            key={f.key}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === f.key ? {
              background: 'rgba(139,92,246,0.2)',
              color: '#A78BFA',
              border: '1px solid rgba(139,92,246,0.4)',
            } : {
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-muted)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon="📋" title="No activity recorded yet" description="Habit creations, completions, and edits will appear here in chronological order." />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-bold uppercase tracking-wider px-2" style={{ color: 'var(--color-text-muted)' }}>
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="relative space-y-3">
                {group.events.map(event => {
                  const actorName = event.actorId === GAURAV_ID ? 'Gaurav' : 'Radhika';
                  const isMe = event.actorId === currentUser?.uid;
                  const color = getEventColor(event.type);

                  return (
                    <motion.div key={event.id} variants={itemVariants} className="flex items-center gap-3.5">
                      <Avatar
                        name={actorName}
                        size="sm"
                        isGaurav={event.actorId === GAURAV_ID}
                      />
                      <div
                        className="flex-1 rounded-xl p-3.5 border glass-strong"
                        style={{ borderColor: `${color}20` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{getEventIcon(event.type)}</span>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              <span className="font-bold text-white">
                                {isMe ? 'You' : actorName}
                              </span>{' '}
                              {activityTypeLabel[event.type]}{' '}
                              {event.habitName && (
                                <span className="font-bold" style={{ color }}>
                                  {event.habitName}
                                </span>
                              )}
                              {event.milestone && (
                                <span className="font-bold text-amber-400">
                                  {' '}{event.milestone} days! 🔥
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                            {formatRelativeTime(event.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
