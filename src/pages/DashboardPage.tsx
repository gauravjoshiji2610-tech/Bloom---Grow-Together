import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Flame, Target, TrendingUp, ChevronRight, Star, Sparkles, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { ProgressRing } from '../components/ProgressRing';
import { StreakBadge } from '../components/StreakBadge';
import { Avatar } from '../components/Avatar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { LinkifiedText } from '../components/LinkifiedText';
import { authService } from '../services/authService';
import { habitService, isScheduledOnDate } from '../services/habitService';
import { activityService } from '../services/activityService';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import { getGreeting, getCategoryLabel, getDayName } from '../utils/helpers';
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
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitWithLog | null>(null);

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
  const _todayStr = new Date().toISOString().split('T')[0];
  const todayHabits = myActiveHabits.filter(h => isScheduledOnDate(h, _todayStr));

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

        {/* Hero Banner: Today's Overview */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-6 border glass-strong"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(24,24,36,0.95) 50%, rgba(236,72,153,0.1) 100%)',
            borderColor: 'rgba(139,92,246,0.25)',
          }}
        >
          {/* Background decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full translate-y-1/2 opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #EC4899, transparent)' }} />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <ProgressRing percentage={todayProgress.percentage} size={110} strokeWidth={9}>
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{todayProgress.percentage}%</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>today</div>
                </div>
              </ProgressRing>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-purple-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Daily Progress</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {todayProgress.completed} of {todayProgress.total} habits completed
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {todayProgress.percentage === 100
                    ? '🎉 Perfect score! You’ve crushed all your habits today!'
                    : todayProgress.percentage >= 50
                    ? '💪 Halfway there! Keep the momentum going.'
                    : '🌱 Start your day strong. Every small step counts.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="card p-3 text-center min-w-[80px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame size={16} style={{ color: '#F59E0B' }} />
                  <span className="text-lg font-black text-white">{myMaxStreak}</span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Max Streak</div>
              </div>

              <div className="card p-3 text-center min-w-[80px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target size={16} style={{ color: '#10B981' }} />
                  <span className="text-lg font-black text-white">{myActiveHabits.length}</span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Active Habits</div>
              </div>
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
                    onClick={() => setSelectedHabitForDetail(habit)}
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

      {/* Habit Details Modal for Incomplete Habits */}
      <Modal
        isOpen={!!selectedHabitForDetail}
        onClose={() => setSelectedHabitForDetail(null)}
        title="Habit Details"
      >
        {selectedHabitForDetail && (
          <div className="space-y-4">
            {/* Header with Icon & Name */}
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: `${selectedHabitForDetail.color}20`,
                  border: `1px solid ${selectedHabitForDetail.color}40`,
                }}
              >
                {selectedHabitForDetail.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white truncate">{selectedHabitForDetail.name}</h3>
                  {selectedHabitForDetail.priority === 'high' && (
                    <Star size={14} fill="#EF4444" style={{ color: '#EF4444', flexShrink: 0 }} />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="badge badge-purple">{getCategoryLabel(selectedHabitForDetail.category)}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock size={12} />
                    {selectedHabitForDetail.time}
                  </span>
                  <StreakBadge streak={selectedHabitForDetail.streak} size="sm" />
                </div>
              </div>
            </div>

            {/* Recurrence schedule summary */}
            <div
              className="p-3 rounded-xl border border-white/10 glass text-xs flex items-center justify-between"
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>Schedule</span>
              <span className="font-medium text-white flex items-center gap-1.5">
                {selectedHabitForDetail.recurrence?.enabled && selectedHabitForDetail.recurrence.interval > 1 && (
                  <RefreshCw size={11} className="text-purple-400" />
                )}
                {(() => {
                  const h = selectedHabitForDetail;
                  if (h.recurrence?.enabled) {
                    const { frequency, interval, weekDays, monthDay } = h.recurrence;
                    if (frequency === 'daily') return interval === 1 ? 'Every day' : `Every ${interval} days`;
                    if (frequency === 'weekly') return interval === 1 ? weekDays.map(d => getDayName(d, true)).join(', ') : `Every ${interval}w — ${weekDays.map(d => getDayName(d, true)).join(', ')}`;
                    if (frequency === 'monthly') return interval === 1 ? `Monthly on day ${monthDay}` : `Every ${interval} months on day ${monthDay}`;
                  }
                  return h.repeatType === 'daily'
                    ? 'Every day'
                    : h.selectedDays?.map(d => getDayName(d, true)).join(', ') || 'Scheduled';
                })()}
              </span>
            </div>

            {/* Complete Description with multiline + LinkifiedText */}
            {selectedHabitForDetail.description ? (
              <div className="p-3.5 rounded-xl border border-white/10 glass space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Description
                </p>
                <div
                  className="text-sm text-gray-300 leading-relaxed break-words"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  <LinkifiedText text={selectedHabitForDetail.description} />
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-white/5 glass text-xs text-gray-500 italic">
                No description provided for this habit.
              </div>
            )}

            {/* Goal if present */}
            {selectedHabitForDetail.goal && (
              <div className="p-3 rounded-xl border border-white/5 glass text-xs flex items-center justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>Goal</span>
                <span className="text-gray-300 font-medium">{selectedHabitForDetail.goal}</span>
              </div>
            )}

            {/* Modal Actions: Cancel & Complete */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedHabitForDetail(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex items-center gap-1.5"
                onClick={async () => {
                  if (!currentUser) return;
                  const habitId = selectedHabitForDetail.id;
                  setSelectedHabitForDetail(null);
                  await completeHabit(habitId, currentUser.uid);
                }}
              >
                <CheckCircle2 size={16} />
                Complete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
