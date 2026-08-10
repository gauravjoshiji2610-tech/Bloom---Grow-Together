import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Flame, Target, TrendingUp, ChevronRight, Star, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { ProgressRing } from '../components/ProgressRing';
import { StreakBadge } from '../components/StreakBadge';
import { Avatar } from '../components/Avatar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { authService } from '../services/authService';
import { habitService } from '../services/habitService';
import { activityService } from '../services/activityService';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import { getGreeting, getCategoryLabel } from '../utils/helpers';
import type { User, ActivityEvent, HabitWithLog } from '../types';

import { containerVariants, itemVariants } from '../utils/variants';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { habits, todayProgress, loadHabits, completeHabit, undoCompletion, isLoading } = useHabitStore();
  const navigate = useNavigate();

  const [partner, setPartner] = useState<User | null>(null);
  const [partnerProgress, setPartnerProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [partnerHabits, setPartnerHabits] = useState<HabitWithLog[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [partnerStreak, setPartnerStreak] = useState(0);

  const isGaurav = currentUser?.uid === GAURAV_ID;
  const partnerId = isGaurav ? RADHIKA_ID : GAURAV_ID;

  useEffect(() => {
    if (!currentUser) return;
    loadHabits(currentUser.uid);

    const users = authService.getUsers();
    const partnerUser = isGaurav ? users.radhika : users.gaurav;
    setPartner(partnerUser);

    habitService.getTodayProgress(partnerId).then(setPartnerProgress);
    habitService.getHabits(partnerId).then(pHabits => {
      setPartnerHabits(pHabits.filter(h => !h.isArchived));
      const maxStreak = Math.max(...pHabits.map(h => h.streak), 0);
      setPartnerStreak(maxStreak);
    });
    activityService.getActivity(5).then(setRecentActivity);
  }, [currentUser?.uid]);

  const myActiveHabits = habits.filter(h => !h.isArchived);
  const todayHabits = myActiveHabits.filter(h => {
    if (h.repeatType === 'daily') return true;
    return h.selectedDays.includes(new Date().getDay());
  });
  const completedToday = todayHabits.filter(h => h.todayLog?.completed);
  const remainingToday = todayHabits.filter(h => !h.todayLog?.completed);
  const myMaxStreak = Math.max(...myActiveHabits.map(h => h.streak), 0);

  const activityTypeLabel: Record<string, string> = {
    habit_completed: 'completed',
    habit_undone: 'undid completion of',
    habit_created: 'created habit',
    habit_edited: 'edited habit',
    habit_archived: 'archived habit',
    habit_restored: 'restored habit',
    partner_nudge: 'nudged',
    partner_cheer: 'cheered',
    partner_message: 'messaged',
    streak_milestone: 'hit a streak milestone on',
    profile_updated: 'updated profile',
  };

  if (isLoading && habits.length === 0) {
    return <LoadingSpinner fullscreen label="Loading dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {getGreeting()}
            </p>
            <h1 className="page-title">
              {currentUser?.name} <span className="text-gradient-purple">✦</span>
            </h1>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/habits?new=1')}
            aria-label="Add new habit"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </motion.div>

        {/* Today's Progress Hero */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border glass-strong"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(18,18,26,0.95) 60%, rgba(109,40,217,0.1) 100%)',
            borderColor: 'rgba(139,92,246,0.25)',
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/3 translate-x-1/3 opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />

          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <ProgressRing
                percentage={todayProgress.percentage}
                size={140}
                strokeWidth={10}
                color="#8B5CF6"
              >
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{todayProgress.percentage}%</div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>Today</div>
                </div>
              </ProgressRing>
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Today's Focus</h2>
                <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                  {completedToday.length} of {todayHabits.length} habits completed today
                  {todayProgress.percentage === 100 && todayHabits.length > 0 && ' 🎉'}
                </p>
              </div>

              <div className="flex justify-center sm:justify-start gap-6">
                <div>
                  <div className="text-2xl font-black" style={{ color: '#F59E0B' }}>{myMaxStreak}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Best streak</div>
                </div>
                <div>
                  <div className="text-2xl font-black" style={{ color: '#10B981' }}>{completedToday.length}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{myActiveHabits.length}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Active habits</div>
                </div>
              </div>

              {todayProgress.percentage === 100 && todayHabits.length > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Star size={14} fill="#10B981" />
                  All done for today! Exceptional consistency!
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Up Next Habits */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Up Next Today</h2>
              {remainingToday.length > 0 && (
                <span className="badge badge-purple">{remainingToday.length} remaining</span>
              )}
            </div>

            {myActiveHabits.length === 0 ? (
              <EmptyState
                icon="🌱"
                title="No active habits"
                description="Create your first habit to start building daily consistency with your partner."
                action={{ label: 'Create Habit', onClick: () => navigate('/habits?new=1') }}
              />
            ) : remainingToday.length === 0 ? (
              <div className="card p-8 text-center border border-white/5">
                <div className="text-4xl mb-2">🎊</div>
                <p className="font-bold text-white text-base">All caught up!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  You have completed all scheduled habits for today.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {remainingToday.slice(0, 4).map(habit => (
                  <motion.div
                    key={habit.id}
                    whileHover={{ x: 4 }}
                    className="card p-3.5 flex items-center gap-3 cursor-pointer card-hover"
                    onClick={() => completeHabit(habit.id, currentUser!.uid)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${habit.color}20`, border: `1px solid ${habit.color}30` }}
                    >
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{habit.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{habit.time} · {getCategoryLabel(habit.category)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StreakBadge streak={habit.streak} size="sm" />
                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </motion.div>
                ))}
                {remainingToday.length > 4 && (
                  <button
                    className="w-full text-center text-xs font-semibold py-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => navigate('/habits')}
                  >
                    +{remainingToday.length - 4} more habits
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Partner Card */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Partner Overview</h2>
              <button
                className="btn-ghost text-xs"
                onClick={() => navigate('/partner')}
              >
                View Overview <ChevronRight size={12} className="inline" />
              </button>
            </div>

            {partner ? (
              <div
                className="card p-5 cursor-pointer card-hover"
                onClick={() => navigate('/partner')}
                style={{
                  background: !isGaurav
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(24,24,36,0.95))'
                    : 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(24,24,36,0.95))',
                  borderColor: !isGaurav
                    ? 'rgba(139,92,246,0.25)'
                    : 'rgba(236,72,153,0.25)',
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar
                    name={partner.name}
                    src={partner.avatar}
                    size="lg"
                    isGaurav={!isGaurav}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white text-base">{partner.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{partner.bio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <ProgressRing
                    percentage={partnerProgress.percentage}
                    size={80}
                    strokeWidth={7}
                    color={!isGaurav ? '#8B5CF6' : '#EC4899'}
                  >
                    <div className="text-center">
                      <div className="text-base font-black text-white">{partnerProgress.percentage}%</div>
                    </div>
                  </ProgressRing>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Target size={13} style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {partnerProgress.completed}/{partnerProgress.total} completed today
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame size={13} style={{ color: '#F59E0B' }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {partnerStreak} day streak
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} style={{ color: '#10B981' }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {partnerHabits.length} active habits
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${partnerProgress.percentage}%`,
                      background: `linear-gradient(90deg, ${!isGaurav ? '#6D28D9' : '#9333EA'}, ${!isGaurav ? '#8B5CF6' : '#EC4899'})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p style={{ color: 'var(--color-text-muted)' }}>Partner account pending</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Completed Today section */}
        {completedToday.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="section-title mb-3">Completed Today ✓</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {completedToday.map(habit => (
                <motion.div
                  key={habit.id}
                  whileHover={{ scale: 1.03 }}
                  className="card p-3 text-center cursor-pointer border"
                  style={{
                    background: `linear-gradient(135deg, ${habit.color}15, rgba(24,24,36,0.95))`,
                    borderColor: `${habit.color}35`,
                  }}
                  onClick={() => undoCompletion(habit.id, currentUser!.uid)}
                  title="Click to undo completion"
                >
                  <div className="text-2xl mb-1">{habit.icon}</div>
                  <p className="text-xs font-bold text-white truncate">{habit.name}</p>
                  <div className="mt-1 flex justify-center">
                    <StreakBadge streak={habit.streak} size="sm" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
};
