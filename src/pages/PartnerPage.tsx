import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { ProgressRing } from '../components/ProgressRing';
import { StreakBadge } from '../components/StreakBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { authService } from '../services/authService';
import { habitService } from '../services/habitService';
import { activityService } from '../services/activityService';
import { analyticsService } from '../services/analyticsService';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import { formatRelativeTime, getCategoryLabel } from '../utils/helpers';
import type { User, HabitWithLog, ActivityEvent } from '../types';
import { containerVariants, itemVariants } from '../utils/variants';

export const PartnerPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const isGaurav = currentUser?.uid === GAURAV_ID;
  const partnerId = isGaurav ? RADHIKA_ID : GAURAV_ID;

  const [partner, setPartner] = useState<User | null>(null);
  const [partnerHabits, setPartnerHabits] = useState<HabitWithLog[]>([]);
  const [partnerProgress, setPartnerProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [partnerStreak, setPartnerStreak] = useState(0);
  const [partnerLongestStreak, setPartnerLongestStreak] = useState(0);
  const [partnerActivity, setPartnerActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadPartnerData();

    const unsubHabits = habitService.subscribeHabits(partnerId, () => {
      loadPartnerData();
    });

    return () => {
      unsubHabits();
    };
  }, [currentUser?.uid, partnerId]);

  const loadPartnerData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const users = authService.getUsers();
      const partnerUser = isGaurav ? users.radhika : users.gaurav;
      setPartner(partnerUser);

      const [pHabits, pProgress, pActivity, pStreaks] = await Promise.all([
        habitService.getHabits(partnerId),
        habitService.getTodayProgress(partnerId),
        activityService.getUserActivity(partnerId, 10),
        analyticsService.getOverallStreak(partnerId),
      ]);

      setPartnerHabits(pHabits.filter(h => !h.isArchived));
      setPartnerProgress(pProgress);
      setPartnerActivity(pActivity);
      setPartnerStreak(pStreaks.current);
      setPartnerLongestStreak(pStreaks.longest);
    } finally {
      setIsLoading(false);
    }
  };

  const partnerColor = !isGaurav ? '#8B5CF6' : '#EC4899';

  const activityTypeLabel: Record<string, string> = {
    habit_completed: 'completed',
    habit_undone: 'undid',
    habit_created: 'created',
    habit_archived: 'archived',
    habit_restored: 'restored',
    streak_milestone: 'hit a milestone on',
    profile_updated: 'updated profile',
    habit_edited: 'edited',
  };

  if (isLoading) return <LoadingSpinner fullscreen label={`Loading ${partner?.name || 'partner'}'s data...`} />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="page-title mb-1">Partner Accountability</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Realtime habit progress with {partner?.name}</p>
        </motion.div>

        {/* Partner Hero Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-6 border glass-strong"
          style={{
            background: `linear-gradient(135deg, ${partnerColor}18 0%, rgba(24,24,36,0.95) 60%)`,
            borderColor: `${partnerColor}30`,
          }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${partnerColor}, transparent)` }} />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar name={partner?.name || ''} src={partner?.avatar} size="2xl" isGaurav={!isGaurav} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#181824] bg-emerald-500" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-white">{partner?.name}</h2>
                <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>{partner?.bio}</p>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <ProgressRing percentage={partnerProgress.percentage} size={90} strokeWidth={7} color={partnerColor}>
                    <div>
                      <div className="text-xl font-black text-white">{partnerProgress.percentage}%</div>
                      <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>today</div>
                    </div>
                  </ProgressRing>
                </div>
                <div className="flex flex-col justify-center gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <Flame size={15} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white">{partnerStreak} days</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Current streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Trophy size={15} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white">{partnerLongestStreak} days</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                      <Target size={15} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white">{partnerProgress.completed}/{partnerProgress.total}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Done today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Partner's habits today */}
          <motion.div variants={itemVariants}>
            <h2 className="section-title mb-3">{partner?.name}'s Habits Today</h2>
            <div className="space-y-2.5">
              {partnerHabits
                .filter(h => h.repeatType === 'daily' || h.selectedDays.includes(new Date().getDay()))
                .slice(0, 6)
                .map(habit => {
                  const isDone = habit.todayLog?.completed;
                  return (
                    <div key={habit.id}
                      className="card p-3.5 flex items-center gap-3"
                      style={{
                        borderColor: isDone ? `${habit.color}35` : undefined,
                        background: isDone ? `${habit.color}08` : undefined,
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: `${habit.color}20`, border: `1px solid ${habit.color}30` }}>
                        {habit.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isDone ? 'line-through opacity-60 text-gray-300' : 'text-white'}`}>
                          {habit.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {getCategoryLabel(habit.category)} · {habit.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StreakBadge streak={habit.streak} size="sm" />
                        {isDone ? (
                          <CheckCircle2 size={20} style={{ color: habit.color }} fill={habit.color} />
                        ) : (
                          <Clock size={18} style={{ color: 'var(--color-text-muted)' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              {partnerHabits.length === 0 && (
                <div className="card p-8 text-center border border-white/5">
                  <p className="text-sm font-semibold text-white mb-1">No active habits yet</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    When {partner?.name} creates habits in Firestore, they will automatically sync here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Partner activity */}
          <motion.div variants={itemVariants}>
            <h2 className="section-title mb-3">Recent Activity</h2>
            <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {partnerActivity.slice(0, 8).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                    {event.type === 'habit_completed' ? '✓' :
                     event.type === 'streak_milestone' ? '🔥' : '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="font-semibold text-white">{partner?.name}</span>{' '}
                      {activityTypeLabel[event.type] || 'updated'}{' '}
                      {event.habitName && <span style={{ color: '#A78BFA' }}>{event.habitName}</span>}
                      {event.milestone && <span style={{ color: '#F59E0B' }}> ({event.milestone} days!)</span>}
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
              ))}
              {partnerActivity.length === 0 && (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  No recent partner activity recorded yet.
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};
