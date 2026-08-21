import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Flame, Target, ChevronRight, Star, Sparkles, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { ProgressRing } from '../components/ProgressRing';
import { StreakBadge } from '../components/StreakBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { LinkifiedText } from '../components/LinkifiedText';
import { ExpandableDescription } from '../components/ExpandableDescription';
import { isScheduledOnDate } from '../services/habitService';
import { getGreeting, getCategoryLabel, getDayName } from '../utils/helpers';
import type { HabitWithLog } from '../types';
import { containerVariants, itemVariants } from '../utils/variants';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { habits, todayProgress, loadHabits, completeHabit, undoCompletion, isLoading } = useHabitStore();
  const navigate = useNavigate();

  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitWithLog | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadHabits(currentUser.uid);
  }, [currentUser?.uid]);

  const myActiveHabits = habits.filter(h => !h.isArchived);
  const _todayStr = new Date().toISOString().split('T')[0];
  const todayHabits = myActiveHabits.filter(h => isScheduledOnDate(h, _todayStr));

  const completedToday = todayHabits.filter(h => h.todayLog?.completed);
  const remainingToday = todayHabits.filter(h => !h.todayLog?.completed);
  const myMaxStreak = Math.max(...myActiveHabits.map(h => h.streak), 0);

  if (isLoading && habits.length === 0) {
    return <LoadingSpinner fullscreen label="Initializing Cockpit..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              {getGreeting()} · Pilot
            </p>
            <h1 className="page-title flex items-center gap-2">
              {currentUser?.name} <span className="text-[#00aaff] text-lg animate-pulse">✦</span>
            </h1>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/habits?new=1')}
            aria-label="Add new habit"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </motion.div>

        {/* Cockpit Telemetry Banner: Today's Overview */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-6 border glass-strong"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 102, 177, 0.28) 0%, rgba(10, 15, 24, 0.96) 60%)',
            borderColor: 'rgba(0, 170, 255, 0.35)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 102, 177, 0.2)',
          }}
        >
          {/* Background decorative glows */}
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00aaff, transparent)' }}
          />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <ProgressRing
                percentage={todayProgress.percentage}
                size={110}
                strokeWidth={8}
                color="#00aaff"
                trackColor="rgba(255,255,255,0.08)"
              >
                <div className="text-center">
                  <div
                    className="text-2xl font-black text-white"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {todayProgress.percentage}%
                  </div>
                  <div
                    className="text-[9px] uppercase tracking-widest font-semibold text-[#00aaff]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    COCKPIT
                  </div>
                </div>
              </ProgressRing>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-[#00aaff]" />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00aaff]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Daily Execution Target
                  </span>
                </div>
                <h2
                  className="text-xl md:text-2xl font-bold text-white mb-1 uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {todayProgress.completed} of {todayProgress.total} habits completed
                </h2>
                <p className="text-xs text-gray-300">
                  {todayProgress.percentage === 100
                    ? '⚡ Perfect performance! All daily targets achieved.'
                    : todayProgress.percentage >= 50
                    ? '🔥 High momentum! Halfway through daily mission.'
                    : '🏁 Ignition complete. Build consistency step by step.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="card p-3.5 text-center min-w-[90px] border border-white/10"
                style={{ background: 'rgba(5, 10, 20, 0.7)' }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame size={15} style={{ color: '#F59E0B' }} />
                  <span
                    className="text-lg font-black text-white"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {myMaxStreak}
                  </span>
                </div>
                <div
                  className="text-[9px] font-bold tracking-wider uppercase text-gray-400"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Max Streak
                </div>
              </div>

              <div
                className="card p-3.5 text-center min-w-[90px] border border-white/10"
                style={{ background: 'rgba(5, 10, 20, 0.7)' }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Target size={15} style={{ color: '#10B981' }} />
                  <span
                    className="text-lg font-black text-white"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {myActiveHabits.length}
                  </span>
                </div>
                <div
                  className="text-[9px] font-bold tracking-wider uppercase text-gray-400"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Active Missions
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Up Next Today — All Scheduled Habits */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Today's Missions</h2>
            {remainingToday.length > 0 && (
              <span className="badge badge-purple">{remainingToday.length} remaining</span>
            )}
          </div>

          {myActiveHabits.length === 0 ? (
            <EmptyState
              icon="🏁"
              title="No active missions"
              description="Create your first mission to initialize your daily tracking system."
              action={{ label: 'Create Mission', onClick: () => navigate('/habits?new=1') }}
            />
          ) : remainingToday.length === 0 ? (
            <div className="card p-8 text-center border border-white/10 glass-strong">
              <div className="text-3xl mb-2">🏁</div>
              <p
                className="font-bold text-white text-base uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                All missions accomplished
              </p>
              <p
                className="text-xs mt-1"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}
              >
                You have completed all scheduled commitments for today.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {remainingToday.map(habit => {
                const scheduleText = (() => {
                  if (habit.recurrence?.enabled) {
                    const { frequency, interval, weekDays, monthDay } = habit.recurrence;
                    if (frequency === 'daily') return interval === 1 ? 'Every day' : `Every ${interval} days`;
                    if (frequency === 'weekly') return interval === 1 ? weekDays.map(d => getDayName(d, true)).join(', ') : `Every ${interval}w — ${weekDays.map(d => getDayName(d, true)).join(', ')}`;
                    if (frequency === 'monthly') return interval === 1 ? `Monthly on ${monthDay}` : `Every ${interval} months on ${monthDay}`;
                  }
                  return habit.repeatType === 'daily'
                    ? 'Every day'
                    : habit.selectedDays?.map(d => getDayName(d, true)).join(', ') || 'Scheduled';
                })();

                return (
                  <motion.div
                    key={habit.id}
                    whileHover={{ y: -2 }}
                    className="card p-4 cursor-pointer card-hover border border-white/10 relative flex flex-col justify-between"
                    onClick={() => setSelectedHabitForDetail(habit)}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{
                            background: `${habit.color}25`,
                            border: `1px solid ${habit.color}45`,
                            boxShadow: `0 0 12px ${habit.color}30`,
                          }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-sm font-bold text-white truncate"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              {habit.name}
                            </p>
                            {habit.priority === 'high' && (
                              <Star size={12} fill="#e10600" style={{ color: '#e10600', flexShrink: 0 }} />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="badge badge-purple text-[10px]">{getCategoryLabel(habit.category)}</span>
                            <span
                              className="flex items-center gap-1 text-[11px]"
                              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                            >
                              <Clock size={11} />
                              {habit.time}
                            </span>
                            <span
                              className="flex items-center gap-1 text-[11px]"
                              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                            >
                              {habit.recurrence?.enabled && habit.recurrence.interval > 1 && <RefreshCw size={10} />}
                              {scheduleText}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <StreakBadge streak={habit.streak} size="sm" />
                          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </div>

                      {/* Expandable description with multiline & clickable URLs */}
                      {habit.description && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <ExpandableDescription description={habit.description} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Completed Today Section */}
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
                    background: `linear-gradient(135deg, ${habit.color}18, rgba(14,20,30,0.95))`,
                    borderColor: `${habit.color}45`,
                  }}
                  onClick={() => undoCompletion(habit.id, currentUser!.uid)}
                  title="Click to undo completion"
                >
                  <div className="text-2xl mb-1">{habit.icon}</div>
                  <p
                    className="text-xs font-bold text-white truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {habit.name}
                  </p>
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
        title="Habit Specification"
      >
        {selectedHabitForDetail && (
          <div className="space-y-4">
            {/* Header with Icon & Name */}
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border"
                style={{
                  background: `${selectedHabitForDetail.color}25`,
                  borderColor: `${selectedHabitForDetail.color}50`,
                  boxShadow: `0 0 16px ${selectedHabitForDetail.color}35`,
                }}
              >
                {selectedHabitForDetail.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-lg font-bold text-white truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {selectedHabitForDetail.name}
                  </h3>
                  {selectedHabitForDetail.priority === 'high' && (
                    <Star size={14} fill="#e10600" style={{ color: '#e10600', flexShrink: 0 }} />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="badge badge-purple">{getCategoryLabel(selectedHabitForDetail.category)}</span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                  >
                    <Clock size={12} />
                    {selectedHabitForDetail.time}
                  </span>
                  <StreakBadge streak={selectedHabitForDetail.streak} size="sm" />
                </div>
              </div>
            </div>

            {/* Recurrence schedule summary */}
            <div className="p-3 rounded-xl border border-white/10 glass text-xs flex items-center justify-between">
              <span
                className="uppercase tracking-wider font-semibold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
              >
                Recurrence
              </span>
              <span
                className="font-medium text-white flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {selectedHabitForDetail.recurrence?.enabled && selectedHabitForDetail.recurrence.interval > 1 && (
                  <RefreshCw size={11} className="text-[#00aaff]" />
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
                <p
                  className="text-[10px] font-bold uppercase tracking-widest text-[#00aaff]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Description & Links
                </p>
                <div
                  className="text-sm text-gray-200 leading-relaxed break-words"
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
                <span
                  className="uppercase tracking-wider font-semibold"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                >
                  Target Goal
                </span>
                <span className="text-gray-300 font-medium">{selectedHabitForDetail.goal}</span>
              </div>
            )}

            {/* Modal Actions: Cancel & Complete */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setSelectedHabitForDetail(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-xs flex items-center gap-1.5"
                onClick={async () => {
                  if (!currentUser) return;
                  const habitId = selectedHabitForDetail.id;
                  setSelectedHabitForDetail(null);
                  await completeHabit(habitId, currentUser.uid);
                }}
              >
                <CheckCircle2 size={15} />
                Complete Target
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
