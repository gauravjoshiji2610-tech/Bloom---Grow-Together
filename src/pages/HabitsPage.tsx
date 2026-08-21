import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Archive, X, RefreshCw, Share2, Sparkles, Check, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { HabitCard } from '../components/HabitCard';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LinkifiedText } from '../components/LinkifiedText';
import { ExpandableDescription } from '../components/ExpandableDescription';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';
import { habitService } from '../services/habitService';
import type { Habit, HabitWithLog, HabitCategory, HabitPriority, RepeatType, HabitRecurrence, SharedHabitRequest } from '../types';
import { HABIT_ICONS, HABIT_COLORS, getCategoryLabel, getDayName, formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES: HabitCategory[] = [
  'health','fitness','mindfulness','learning','creativity',
  'social','finance','productivity','nutrition','sleep','other'
];

const todayDateStr = () => new Date().toISOString().split('T')[0];

const defaultRecurrence = (): HabitRecurrence => ({
  enabled: true,
  frequency: 'daily',
  interval: 1,
  weekDays: [0,1,2,3,4,5,6],
  monthDay: new Date().getDate(),
  endDate: null,
  startDate: todayDateStr(),
});

const defaultForm = (userId: string): Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> => ({
  userId: userId as any,
  name: '',
  description: '',
  category: 'health' as HabitCategory,
  icon: '💪',
  color: '#00aaff',
  repeatType: 'daily' as RepeatType,
  selectedDays: [0,1,2,3,4,5,6],
  time: '08:00',
  priority: 'medium' as HabitPriority,
  goal: '',
  notes: '',
  reminderEnabled: false,
  reminderTime: '08:00',
  isArchived: false,
  recurrence: defaultRecurrence(),
});

export const HabitsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const {
    habits,
    receivedRequests,
    sentRequests,
    isLoading,
    loadHabits,
    loadRequests,
    shareHabit,
    acceptRequest,
    declineRequest,
    setReceivedRequests,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    completeHabit,
    undoCompletion,
  } = useHabitStore();

  const [searchParams, setSearchParams] = useSearchParams();

  const isGaurav = currentUser?.uid === GAURAV_ID;
  const partnerId = isGaurav ? RADHIKA_ID : GAURAV_ID;
  const partnerName = isGaurav ? 'Radhika' : 'Gaurav';
  const myName = isGaurav ? 'Gaurav' : 'Radhika';

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showSentRequests, setShowSentRequests] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null);
  const [form, setForm] = useState(() => defaultForm(currentUser?.uid || ''));
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadHabits(currentUser.uid);
    loadRequests(currentUser.uid, partnerId);

    const unsubRequests = habitService.subscribeHabitRequests(currentUser.uid, (reqs) => {
      setReceivedRequests(reqs);
    });

    return () => {
      unsubRequests();
    };
  }, [currentUser?.uid, partnerId]);

  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('action') === 'new') {
      openNewForm();
      setSearchParams({});
    }
  }, [searchParams]);

  const updateRecurrence = (updates: Partial<HabitRecurrence>) => {
    setForm(f => ({
      ...f,
      recurrence: {
        ...(f.recurrence ?? defaultRecurrence()),
        ...updates,
      },
    }));
  };

  const openNewForm = () => {
    setEditingHabit(null);
    setForm(defaultForm(currentUser?.uid || ''));
    setShareWithPartner(false);
    setFormOpen(true);
  };

  const openEditForm = (habit: HabitWithLog) => {
    setEditingHabit(habit);
    setShareWithPartner(false);
    setForm({
      userId: habit.userId,
      name: habit.name,
      description: habit.description,
      category: habit.category,
      icon: habit.icon,
      color: habit.color,
      repeatType: habit.repeatType,
      selectedDays: habit.selectedDays,
      time: habit.time,
      priority: habit.priority,
      goal: habit.goal,
      notes: habit.notes,
      reminderEnabled: habit.reminderEnabled,
      reminderTime: habit.reminderTime,
      isArchived: habit.isArchived,
      recurrence: habit.recurrence ?? {
        enabled: habit.repeatType === 'daily',
        frequency: habit.repeatType === 'daily' ? 'daily' : 'weekly',
        interval: 1,
        weekDays: habit.selectedDays ?? [0,1,2,3,4,5,6],
        monthDay: 1,
        endDate: null,
        startDate: habit.createdAt?.split('T')[0] ?? todayDateStr(),
      },
    });
    setFormOpen(true);
  };

  const handleComplete = async (id: string) => {
    if (!currentUser) return;
    setCompletingId(id);
    try {
      await completeHabit(id, currentUser.uid);
      toast.success('Habit completed! 🔥');
    } catch {
      toast.error('Failed to complete habit');
    } finally {
      setCompletingId(null);
    }
  };

  const handleUndo = async (id: string) => {
    if (!currentUser) return;
    try {
      await undoCompletion(id, currentUser.uid);
      toast.success('Habit undone');
    } catch {
      toast.error('Failed to undo');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveHabit(id);
      toast.success('Habit archived');
    } catch {
      toast.error('Failed to archive habit');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreHabit(id);
      toast.success('Habit restored');
    } catch {
      toast.error('Failed to restore habit');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHabit(deleteTarget);
      toast.success('Habit deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete habit');
    }
  };

  const handleAccept = async (request: SharedHabitRequest) => {
    if (!currentUser) return;
    setProcessingRequestId(request.id);
    try {
      await acceptRequest(request, currentUser.uid);
      toast.success(`Accepted "${request.habitData.name}"! Added to your habits.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to accept habit');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDecline = async (request: SharedHabitRequest) => {
    if (!currentUser) return;
    setProcessingRequestId(request.id);
    try {
      await declineRequest(request);
      toast.success(`Declined "${request.habitData.name}"`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to decline habit');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const rec = form.recurrence ?? defaultRecurrence();
      const legacyRepeatType: RepeatType = rec.enabled
        ? (rec.frequency === 'daily' ? 'daily' : rec.frequency === 'weekly' ? 'weekly' : 'custom')
        : form.repeatType;

      const legacySelectedDays: number[] = rec.enabled
        ? (rec.frequency === 'daily' ? [0,1,2,3,4,5,6] : rec.frequency === 'weekly' ? rec.weekDays : [rec.monthDay % 7])
        : form.selectedDays;

      const payload = {
        ...form,
        userId: currentUser.uid,
        repeatType: legacyRepeatType,
        selectedDays: legacySelectedDays,
        recurrence: rec,
      };

      if (editingHabit) {
        await updateHabit(editingHabit.id, payload);
        toast.success('Habit updated!');
      } else {
        await createHabit(payload);
        toast.success('Habit created!');

        if (shareWithPartner) {
          try {
            await shareHabit(currentUser.uid, myName, partnerId, partnerName, payload);
            toast.success(`Share request sent to ${partnerName}! 🌸`);
          } catch (shareErr: any) {
            console.error('Auto-share error:', shareErr);
            toast.error(`Habit created, but could not share with ${partnerName}: ${shareErr?.message || ''}`);
          }
        }
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLegacyDay = (day: number) => {
    setForm(f => {
      const exists = f.selectedDays.includes(day);
      const next = exists ? f.selectedDays.filter(d => d !== day) : [...f.selectedDays, day].sort();
      return { ...f, selectedDays: next };
    });
  };

  const filteredHabits = habits
    .filter(h => showArchived ? h.isArchived : !h.isArchived)
    .filter(h => filterCategory === 'all' || h.category === filterCategory)
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.description.toLowerCase().includes(search.toLowerCase()));

  const rec = form.recurrence ?? defaultRecurrence();
  const recEnabled = rec.enabled;

  const recurrenceSummary = (() => {
    if (!recEnabled) return 'No repeat cycle';
    const { frequency, interval } = rec;
    if (frequency === 'daily')   return interval === 1 ? 'Every day' : `Every ${interval} days`;
    if (frequency === 'weekly')  return interval === 1 ? 'Every week' : `Every ${interval} weeks`;
    if (frequency === 'monthly') return interval === 1 ? 'Every month' : `Every ${interval} months`;
    return '';
  })();

  const pendingReceivedRequests = receivedRequests.filter(r => r.status === 'pending');

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Habit Registry</h1>
          <p
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            {showArchived ? 'Archived Commitments' : 'Active Habit Specifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sentRequests.length > 0 && (
            <button
              className="btn-secondary text-xs"
              onClick={() => setShowSentRequests(!showSentRequests)}
            >
              <Send size={13} />
              <span className="hidden sm:inline">Sent Shares</span> ({sentRequests.length})
            </button>
          )}
          <button
            className="btn-secondary text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive size={13} />
            {showArchived ? 'Show Active' : 'Archived'}
          </button>
          <button className="btn-primary" onClick={openNewForm}>
            <Plus size={15} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </div>
      </div>

      {/* ── PENDING SHARED HABITS BANNER ───────────────────── */}
      {pendingReceivedRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-xs font-bold text-[#00aaff] flex items-center gap-2 uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Sparkles size={14} className="text-[#00aaff]" />
              Shared with You ({pendingReceivedRequests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReceivedRequests.map(req => {
              const habitData = req.habitData;
              const scheduleText = (() => {
                if (habitData.recurrence?.enabled) {
                  const { frequency, interval, weekDays, monthDay } = habitData.recurrence;
                  if (frequency === 'daily') return interval === 1 ? 'Every day' : `Every ${interval} days`;
                  if (frequency === 'weekly') return interval === 1 ? weekDays.map(d => getDayName(d, true)).join(', ') : `Every ${interval}w — ${weekDays.map(d => getDayName(d, true)).join(', ')}`;
                  if (frequency === 'monthly') return interval === 1 ? `Monthly on ${monthDay}` : `Every ${interval} months on ${monthDay}`;
                }
                return habitData.repeatType === 'daily'
                  ? 'Every day'
                  : habitData.selectedDays?.map(d => getDayName(d, true)).join(', ') || 'Custom';
              })();

              return (
                <div
                  key={req.id}
                  className="card p-4 border border-[#00aaff]/40 relative overflow-hidden glass-strong"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 102, 177, 0.22) 0%, rgba(14, 20, 30, 0.96) 60%)',
                    boxShadow: '0 8px 30px rgba(0, 102, 177, 0.25)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="badge badge-purple text-[10px] font-semibold flex items-center gap-1.5">
                      <Share2 size={11} />
                      Shared by {req.senderName}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                    >
                      {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${habitData.color}25`, border: `1px solid ${habitData.color}50` }}
                    >
                      {habitData.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-white text-base truncate"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {habitData.name}
                      </h3>
                      {habitData.description && (
                        <ExpandableDescription description={habitData.description} className="mt-1" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="badge badge-purple">{getCategoryLabel(habitData.category)}</span>
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                    >
                      <Clock size={11} />
                      {habitData.time}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                    >
                      {habitData.recurrence?.enabled && habitData.recurrence.interval > 1 && <RefreshCw size={10} />}
                      {scheduleText}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleDecline(req)}
                      className="btn-ghost text-xs py-1.5 px-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <X size={13} className="inline mr-1" />
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleAccept(req)}
                      className="btn-primary text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      Accept Habit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── SENT SHARES STATUS DRAWER ─────────────────────── */}
      {showSentRequests && sentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card p-4 space-y-3 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Send size={13} className="text-[#00aaff]" />
              Shared Habits Sent to {partnerName}
            </h3>
            <button
              onClick={() => setShowSentRequests(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {sentRequests.map(req => (
              <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{req.habitData.icon}</span>
                  <span className="font-semibold text-white truncate">{req.habitData.name}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status === 'pending' && (
                    <span className="badge text-amber-400 bg-amber-500/10 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                  {req.status === 'accepted' && (
                    <span className="badge text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <Check size={11} />
                      Accepted
                    </span>
                  )}
                  {req.status === 'declined' && (
                    <span className="badge text-red-400 bg-red-500/10 border border-red-500/20 flex items-center gap-1">
                      <X size={11} />
                      Declined
                    </span>
                  )}
                  <span
                    className="text-[10px]"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                  >
                    {formatRelativeTime(req.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search habits..."
            className="input-field pl-10 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="input-field sm:w-48 text-sm"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
      </div>

      {/* Habit List */}
      {isLoading ? (
        <LoadingSpinner label="Loading habit telemetry..." />
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHabits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onComplete={handleComplete}
                  onUndo={handleUndo}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  isCompleting={completingId === habit.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={showArchived ? '📦' : '🏁'}
              title={showArchived ? 'No archived habits' : 'No habits found'}
              description={showArchived ? 'Archived habits will appear here.' : search ? 'Try adjusting your search query.' : 'Create your first habit to start building consistency.'}
              action={!showArchived ? { label: 'Create Habit', onClick: openNewForm } : undefined}
            />
          )}
        </AnimatePresence>
      )}

      {/* Habit Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingHabit ? 'Edit Habit Specification' : 'Create New Habit Specification'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label">Habit Name *</label>
            <input
              type="text" required placeholder="e.g., Morning Workout, Read 30 mins..."
              className="input-field" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Description</label>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-[#00aaff]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Multiline & URLs supported
              </span>
            </div>
            <textarea
              rows={3}
              placeholder="Why is this habit important? (Press Enter for new lines, add links, etc.)"
              className="input-field resize-y min-h-[84px] leading-relaxed text-sm py-2.5"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input-field text-sm"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as HabitCategory }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input-field text-sm"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as HabitPriority }))}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="label">Icon Symbol</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-white/10 glass">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon} type="button"
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={form.icon === icon ? { background: 'rgba(0,102,177,0.3)', border: '1px solid #00aaff' } : {}}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="label">Color Accent</label>
            <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border border-white/10 glass">
              {HABIT_COLORS.map(color => (
                <button
                  key={color} type="button"
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: color, border: form.color === color ? '2px solid white' : 'none' }}
                  onClick={() => setForm(f => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          {/* ── REPEAT SECTION ─────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw size={14} style={{ color: recEnabled ? '#00aaff' : 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Repeat Cycle</p>
                  <p
                    className="text-[11px]"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                  >
                    {recurrenceSummary}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="repeat-toggle"
                onClick={() => updateRecurrence({ enabled: !recEnabled })}
                className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                style={{
                  width: 44, height: 24,
                  background: recEnabled ? '#0066b1' : 'rgba(255,255,255,0.12)',
                }}
                aria-label="Toggle repeat"
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ width: 20, height: 20, left: recEnabled ? 22 : 2 }}
                />
              </button>
            </div>

            {/* Repeat ON Controls */}
            {recEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-4 rounded-xl border border-white/10 glass"
              >
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
                      style={rec.frequency === freq
                        ? { background: 'linear-gradient(135deg, #1c69d4 0%, #005599 100%)', color: 'white', border: '1px solid rgba(0,170,255,0.5)', fontFamily: 'var(--font-display)' }
                        : { color: 'var(--color-text-muted)', background: 'transparent', fontFamily: 'var(--font-display)' }
                      }
                      onClick={() => updateRecurrence({ frequency: freq, interval: 1 })}
                    >
                      {freq}
                    </button>
                  ))}
                </div>

                {rec.frequency === 'daily' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Interval</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Every</span>
                      <select
                        id="daily-interval"
                        className="input-field py-1.5 text-sm text-center"
                        style={{ width: 72, fontFamily: 'var(--font-mono)' }}
                        value={rec.interval}
                        onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400">
                        {rec.interval === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                )}

                {rec.frequency === 'weekly' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Interval</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Every</span>
                        <select
                          id="weekly-interval"
                          className="input-field py-1.5 text-sm text-center"
                          style={{ width: 72, fontFamily: 'var(--font-mono)' }}
                          value={rec.interval}
                          onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-xs text-gray-400">
                          {rec.interval === 1 ? 'week' : 'weeks'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2 text-gray-400">Active Days</p>
                      <div className="flex justify-between gap-1">
                        {[0,1,2,3,4,5,6].map(day => (
                          <button
                            key={day} type="button"
                            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                            style={rec.weekDays.includes(day)
                              ? { background: '#0066b1', color: 'white', border: '1px solid #00aaff', fontFamily: 'var(--font-mono)' }
                              : { background: 'rgba(255,255,255,0.05)', color: '#71717A', fontFamily: 'var(--font-mono)' }
                            }
                            onClick={() => {
                              const next = rec.weekDays.includes(day)
                                ? rec.weekDays.filter(d => d !== day)
                                : [...rec.weekDays, day].sort();
                              if (next.length > 0) updateRecurrence({ weekDays: next });
                            }}
                          >
                            {getDayName(day, true)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {rec.frequency === 'monthly' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Interval</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Every</span>
                        <select
                          id="monthly-interval"
                          className="input-field py-1.5 text-sm text-center"
                          style={{ width: 72, fontFamily: 'var(--font-mono)' }}
                          value={rec.interval}
                          onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-xs text-gray-400">
                          {rec.interval === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">On Day</span>
                      <select
                        id="monthly-day"
                        className="input-field py-1.5 text-sm text-center"
                        style={{ width: 72, fontFamily: 'var(--font-mono)' }}
                        value={rec.monthDay}
                        onChange={e => updateRecurrence({ monthDay: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* End Date */}
                <div className="pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">End Date</span>
                    <button
                      type="button"
                      id="end-date-toggle"
                      onClick={() => updateRecurrence({ endDate: rec.endDate ? null : todayDateStr() })}
                      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                      style={{
                        width: 44, height: 24,
                        background: rec.endDate ? '#0066b1' : 'rgba(255,255,255,0.12)',
                      }}
                      aria-label="Toggle end date"
                    >
                      <span
                        className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
                        style={{ width: 20, height: 20, left: rec.endDate ? 22 : 2 }}
                      />
                    </button>
                  </div>
                  {rec.endDate && (
                    <input
                      type="date"
                      id="end-date-input"
                      className="input-field text-sm mt-2"
                      value={rec.endDate}
                      min={todayDateStr()}
                      onChange={e => updateRecurrence({ endDate: e.target.value || null })}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Repeat OFF legacy controls */}
            {!recEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl border border-white/10 glass"
              >
                <div>
                  <p className="text-xs font-medium mb-2 text-gray-400">Frequency</p>
                  <select
                    className="input-field text-sm"
                    value={form.repeatType}
                    onChange={e => setForm(f => ({ ...f, repeatType: e.target.value as RepeatType }))}
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekly">Specific Days</option>
                  </select>
                </div>
                {form.repeatType !== 'daily' && (
                  <div>
                    <p className="text-xs font-medium mb-2 text-gray-400">Active Days</p>
                    <div className="flex justify-between gap-1">
                      {[0,1,2,3,4,5,6].map(day => (
                        <button
                          key={day} type="button"
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                          style={form.selectedDays.includes(day)
                            ? { background: '#0066b1', color: 'white', border: '1px solid #00aaff', fontFamily: 'var(--font-mono)' }
                            : { background: 'rgba(255,255,255,0.05)', color: '#71717A', fontFamily: 'var(--font-mono)' }
                          }
                          onClick={() => toggleLegacyDay(day)}
                        >
                          {getDayName(day, true)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Target Time */}
          <div>
            <label className="label">Target Time</label>
            <input
              type="time" className="input-field"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>

          {/* Share with partner toggle */}
          {!editingHabit && (
            <div className="pt-2 border-t border-white/10">
              <label
                className="flex items-start gap-3 p-3.5 rounded-xl border border-[#00aaff]/30 bg-[#0066b1]/10 cursor-pointer hover:bg-[#0066b1]/20 transition-all"
              >
                <input
                  type="checkbox"
                  checked={shareWithPartner}
                  onChange={e => setShareWithPartner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-600 text-[#00aaff] focus:ring-[#00aaff] bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Share2 size={14} className="text-[#00aaff]" />
                    Share with {partnerName}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sends a copy of this habit to {partnerName}&apos;s pending requests for acceptance.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Habit Specification"
        message="Are you sure you want to delete this habit? All completion history will be permanently removed."
        confirmLabel="Delete"
        confirmDanger
      />
    </div>
  );
};
