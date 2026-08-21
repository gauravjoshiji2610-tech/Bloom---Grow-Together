import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, CheckCircle2, Clock, Calendar, ListTodo, Star, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { ProgressRing } from '../components/ProgressRing';
import { StreakBadge } from '../components/StreakBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { LinkifiedText } from '../components/LinkifiedText';
import { ExpandableDescription } from '../components/ExpandableDescription';
import { authService } from '../services/authService';
import { habitService, isScheduledOnDate } from '../services/habitService';
import { analyticsService } from '../services/analyticsService';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import { getCategoryLabel, getDayName } from '../utils/helpers';
import type { User, HabitWithLog } from '../types';
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
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitWithLog | null>(null);
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

      const [pHabits, pProgress, pStreaks] = await Promise.all([
        habitService.getHabits(partnerId),
        habitService.getTodayProgress(partnerId),
        analyticsService.getOverallStreak(partnerId),
      ]);

      setPartnerHabits(pHabits.filter(h => !h.isArchived));
      setPartnerProgress(pProgress);
      setPartnerStreak(pStreaks.current);
      setPartnerLongestStreak(pStreaks.longest);
    } finally {
      setIsLoading(false);
    }
  };

  const partnerColor = '#00aaff';
  const todayStr = new Date().toISOString().split('T')[0];
  const partnerTodayHabits = partnerHabits.filter(h => isScheduledOnDate(h, todayStr));
  const partnerTotalHabits = partnerHabits;

  if (isLoading && partnerHabits.length === 0) {
    return <LoadingSpinner fullscreen label={`Connecting to ${partner?.name || 'partner'}'s cockpit...`} />;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="page-title mb-1">Co-Pilot Telemetry</h1>
          <p
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            Realtime accountability sync with {partner?.name}
          </p>
        </motion.div>

        {/* Partner Hero Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-6 border glass-strong"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 102, 177, 0.28) 0%, rgba(14, 20, 30, 0.96) 60%)',
            borderColor: 'rgba(0, 170, 255, 0.35)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 102, 177, 0.2)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/2 translate-x-1/2 opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00aaff, transparent)' }}
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar name={partner?.name || ''} src={partner?.avatar} size="2xl" isGaurav={!isGaurav} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0e131c] bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="text-center">
                <h2
                  className="text-xl font-bold text-white uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {partner?.name}
                </h2>
                <p
                  className="text-xs max-w-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {partner?.bio}
                </p>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <ProgressRing percentage={partnerProgress.percentage} size={90} strokeWidth={7} color={partnerColor}>
                    <div>
                      <div
                        className="text-xl font-black text-white"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {partnerProgress.percentage}%
                      </div>
                      <div
                        className="text-[9px] uppercase tracking-widest font-semibold text-[#00aaff]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        today
                      </div>
                    </div>
                  </ProgressRing>
                </div>
                <div className="flex flex-col justify-center gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <Flame size={15} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>{partnerStreak} days</p>
                      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Current streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Trophy size={15} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>{partnerLongestStreak} days</p>
                      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Best streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#00aaff]/30" style={{ background: 'rgba(0,102,177,0.2)' }}>
                      <Target size={15} style={{ color: '#00aaff' }} />
                    </div>
                    <div>
                      <p className="text-base font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>{partnerProgress.completed}/{partnerProgress.total}</p>
                      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Done today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 1: TODAY'S HABITS ──────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Calendar size={17} className="text-[#00aaff]" />
              {partner?.name}&apos;s Habits Today ({partnerTodayHabits.length})
            </h2>
            {partnerTodayHabits.length > 0 && (
              <span className="badge badge-purple text-xs">
                {partnerProgress.completed} of {partnerProgress.total} completed
              </span>
            )}
          </div>

          {partnerTodayHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {partnerTodayHabits.map(habit => {
                const isDone = !!habit.todayLog?.completed;
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
                    className="card p-4 cursor-pointer card-hover border relative flex flex-col justify-between"
                    style={{
                      borderColor: isDone ? `${habit.color}45` : 'rgba(255, 255, 255, 0.09)',
                      background: isDone
                        ? `linear-gradient(135deg, ${habit.color}10 0%, rgba(14, 20, 30, 0.95) 100%)`
                        : 'rgba(18, 24, 34, 0.86)',
                    }}
                    onClick={() => setSelectedHabitForDetail(habit)}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{
                            background: `${habit.color}25`,
                            border: `1px solid ${habit.color}45`,
                            boxShadow: `0 0 12px ${habit.color}25`,
                          }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`text-sm font-bold truncate ${isDone ? 'line-through opacity-60 text-gray-300' : 'text-white'}`}
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StreakBadge streak={habit.streak} size="sm" />
                          {isDone ? (
                            <CheckCircle2
                              size={22}
                              style={{ color: habit.color, filter: `drop-shadow(0 0 6px ${habit.color}80)` }}
                              fill={habit.color}
                            />
                          ) : (
                            <Clock size={20} style={{ color: 'var(--color-text-muted)' }} />
                          )}
                        </div>
                      </div>

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
          ) : (
            <div className="card p-6 text-center border border-white/10 glass">
              <p
                className="text-sm font-semibold text-white mb-1 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                No habits scheduled for {partner?.name} today
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
              >
                {partner?.name} has no commitments scheduled on this date.
              </p>
            </div>
          )}
        </motion.div>

        {/* ── SECTION 2: TOTAL HABITS ────────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <ListTodo size={17} className="text-[#00aaff]" />
              Total Active Habits ({partnerTotalHabits.length})
            </h2>
          </div>

          {partnerTotalHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {partnerTotalHabits.map(habit => {
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
                            boxShadow: `0 0 12px ${habit.color}25`,
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StreakBadge streak={habit.streak} size="sm" />
                        </div>
                      </div>

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
          ) : (
            <div className="card p-8 text-center border border-white/10 glass">
              <p
                className="text-sm font-semibold text-white mb-1 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                No active habits yet
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
              >
                When {partner?.name} creates habits in Firestore, they will automatically sync here.
              </p>
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* View-Only Partner Habit Details Modal */}
      <Modal
        isOpen={!!selectedHabitForDetail}
        onClose={() => setSelectedHabitForDetail(null)}
        title={`${partner?.name || 'Partner'}'s Habit Specification`}
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
                Schedule
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

            {/* View-Only Modal Actions: Close ONLY */}
            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setSelectedHabitForDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
