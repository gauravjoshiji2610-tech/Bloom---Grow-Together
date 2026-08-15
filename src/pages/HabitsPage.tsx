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
  color: '#8B5CF6',
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

    // Realtime subscription for incoming shared habit requests
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

  // Helper to update nested recurrence fields without losing other form values
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
      // Load existing recurrence, or create a safe default for old habits
      recurrence: habit.recurrence ?? {
        enabled: false,
        frequency: 'daily',
        interval: 1,
        weekDays: habit.selectedDays?.length > 0 ? [...habit.selectedDays] : [0,1,2,3,4,5,6],
        monthDay: new Date().getDate(),
        endDate: null,
        startDate: habit.createdAt.split('T')[0],
      },
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !currentUser) {
      toast.error('Habit name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, form);
        toast.success('Habit updated! ✨');
      } else {
        await createHabit({ ...form, userId: currentUser.uid });
        if (shareWithPartner) {
          await shareHabit(currentUser.uid, myName, partnerId, partnerName, form);
          toast.success(`Habit created & shared with ${partnerName}! 🌸`);
        } else {
          toast.success('Habit created! 🌱');
        }
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (req: SharedHabitRequest) => {
    if (!currentUser) return;
    setProcessingRequestId(req.id);
    try {
      await acceptRequest(req, currentUser.uid);
      toast.success(`"${req.habitData.name}" added to your habits! 🌱`);
    } catch {
      toast.error('Failed to accept shared habit');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDecline = async (req: SharedHabitRequest) => {
    setProcessingRequestId(req.id);
    try {
      await declineRequest(req);
      toast('Shared habit request declined');
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!currentUser) return;
    setCompletingId(id);
    try {
      await completeHabit(id, currentUser.uid);
      toast.success('Habit completed! 🔥');
    } catch {
      toast.error('Failed to mark complete');
    } finally {
      setCompletingId(null);
    }
  };

  const handleUndo = async (id: string) => {
    if (!currentUser) return;
    try {
      await undoCompletion(id, currentUser.uid);
      toast('Completion undone');
    } catch {
      toast.error('Failed to undo completion');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveHabit(id);
      toast('Habit archived 📦');
    } catch {
      toast.error('Failed to archive habit');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreHabit(id);
      toast.success('Habit restored! ♻️');
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

  const filteredHabits = habits.filter(habit => {
    if (showArchived ? !habit.isArchived : habit.isArchived) return false;
    if (search && !habit.name.toLowerCase().includes(search.toLowerCase()) && !habit.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterCategory !== 'all' && habit.category !== filterCategory) return false;
    return true;
  });

  // Used only for the legacy (Repeat OFF) day picker
  const toggleLegacyDay = (day: number) => {
    setForm(f => {
      const selectedDays = f.selectedDays.includes(day)
        ? f.selectedDays.filter(d => d !== day)
        : [...f.selectedDays, day].sort();
      return { ...f, selectedDays };
    });
  };

  // Convenient aliases for the current recurrence state
  const rec = form.recurrence!;
  const recEnabled = rec.enabled;

  // Human-readable summary shown in the toggle header
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
          <h1 className="page-title mb-1">Habits</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {showArchived ? 'Archived habits' : 'Your active habit commitments'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sentRequests.length > 0 && (
            <button
              className="btn-secondary text-xs"
              onClick={() => setShowSentRequests(!showSentRequests)}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Sent Shares</span> ({sentRequests.length})
            </button>
          )}
          <button
            className="btn-secondary text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive size={14} />
            {showArchived ? 'Show Active' : 'Archived'}
          </button>
          <button className="btn-primary" onClick={openNewForm}>
            <Plus size={16} />
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
            <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
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
                  className="card p-4 border border-purple-500/40 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(24,24,36,0.95))' }}
                >
                  {/* Badge: Shared by {senderName} */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="badge badge-purple text-[11px] font-semibold flex items-center gap-1.5">
                      <Share2 size={11} />
                      Shared by {req.senderName}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>

                  {/* Habit info */}
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${habitData.color}20`, border: `1px solid ${habitData.color}40` }}
                    >
                      {habitData.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate">{habitData.name}</h3>
                      {habitData.description && (
                        <ExpandableDescription description={habitData.description} className="mt-1" />
                      )}
                    </div>
                  </div>

                  {/* Habit tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="badge badge-purple">{getCategoryLabel(habitData.category)}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock size={11} />
                      {habitData.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {habitData.recurrence?.enabled && habitData.recurrence.interval > 1 && <RefreshCw size={10} />}
                      {scheduleText}
                    </span>
                  </div>

                  {/* Action buttons */}
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

      {/* ── SENT SHARES STATUS DRAWER / SECTION ────────────── */}
      {showSentRequests && sentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card p-4 space-y-3 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send size={14} className="text-purple-400" />
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
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
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
        <LoadingSpinner label="Loading habits..." />
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
              icon={showArchived ? '📦' : '🌱'}
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
        title={editingHabit ? 'Edit Habit' : 'Create New Habit'}
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
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Multiline & URLs supported</span>
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
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-white/10 glass">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon} type="button"
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={form.icon === icon ? { background: 'rgba(139,92,246,0.3)', border: '1px solid #8B5CF6' } : {}}
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
            {/* Toggle header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw size={15} style={{ color: recEnabled ? '#8B5CF6' : 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Repeat</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{recurrenceSummary}</p>
                </div>
              </div>
              {/* Pill toggle */}
              <button
                type="button"
                id="repeat-toggle"
                onClick={() => updateRecurrence({ enabled: !recEnabled })}
                className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                style={{
                  width: 44, height: 24,
                  background: recEnabled ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
                }}
                aria-label="Toggle repeat"
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ width: 20, height: 20, left: recEnabled ? 22 : 2 }}
                />
              </button>
            </div>

            {/* ── Repeat ON: new recurrence controls ── */}
            {recEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-4 rounded-xl border border-white/10 glass"
              >
                {/* Frequency tabs */}
                <div
                  className="flex gap-1 p-1 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={rec.frequency === freq
                        ? { background: '#8B5CF6', color: 'white' }
                        : { color: 'var(--color-text-muted)', background: 'transparent' }
                      }
                      onClick={() => updateRecurrence({ frequency: freq, interval: 1 })}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>

                {/* ─ Daily: interval dropdown ─ */}
                {rec.frequency === 'daily' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Interval
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Every</span>
                      <select
                        id="daily-interval"
                        className="input-field py-1.5 text-sm text-center"
                        style={{ width: 72 }}
                        value={rec.interval}
                        onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {rec.interval === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ─ Weekly: interval + day picker ─ */}
                {rec.frequency === 'weekly' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Interval
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Every</span>
                        <select
                          id="weekly-interval"
                          className="input-field py-1.5 text-sm text-center"
                          style={{ width: 72 }}
                          value={rec.interval}
                          onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {rec.interval === 1 ? 'week' : 'weeks'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                        On these days
                      </p>
                      <div className="flex justify-between gap-1">
                        {[0,1,2,3,4,5,6].map(day => (
                          <button
                            key={day} type="button"
                            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                            style={rec.weekDays.includes(day)
                              ? { background: '#8B5CF6', color: 'white' }
                              : { background: 'rgba(255,255,255,0.05)', color: '#71717A' }
                            }
                            onClick={() => {
                              const next = rec.weekDays.includes(day)
                                ? rec.weekDays.filter(d => d !== day)
                                : [...rec.weekDays, day].sort();
                              // Prevent deselecting all days
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

                {/* ─ Monthly: interval + day-of-month ─ */}
                {rec.frequency === 'monthly' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Interval
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Every</span>
                        <select
                          id="monthly-interval"
                          className="input-field py-1.5 text-sm text-center"
                          style={{ width: 72 }}
                          value={rec.interval}
                          onChange={e => updateRecurrence({ interval: parseInt(e.target.value) })}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {rec.interval === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        On day
                      </span>
                      <select
                        id="monthly-day"
                        className="input-field py-1.5 text-sm text-center"
                        style={{ width: 72 }}
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

                {/* ─ End Date ─ */}
                <div className="pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      End Date
                    </span>
                    <button
                      type="button"
                      id="end-date-toggle"
                      onClick={() => updateRecurrence({ endDate: rec.endDate ? null : todayDateStr() })}
                      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                      style={{
                        width: 44, height: 24,
                        background: rec.endDate ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
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

            {/* ── Repeat OFF: legacy frequency controls ── */}
            {!recEnabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl border border-white/10 glass"
              >
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Frequency</p>
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
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Active days</p>
                    <div className="flex justify-between gap-1">
                      {[0,1,2,3,4,5,6].map(day => (
                        <button
                          key={day} type="button"
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                          style={form.selectedDays.includes(day)
                            ? { background: '#8B5CF6', color: 'white' }
                            : { background: 'rgba(255,255,255,0.05)', color: '#71717A' }
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
          {/* ── END REPEAT SECTION ─────────────────────────── */}

          {/* Target Time */}
          <div>
            <label className="label">Target Time</label>
            <input
              type="time" className="input-field"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>

          {/* ── SHARE WITH PARTNER OPTION (Create Mode Only) ── */}
          {!editingHabit && (
            <div className="pt-2 border-t border-white/10">
              <label
                className="flex items-start gap-3 p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/20 cursor-pointer hover:bg-purple-950/30 transition-all"
              >
                <input
                  type="checkbox"
                  checked={shareWithPartner}
                  onChange={e => setShareWithPartner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Share2 size={14} className="text-purple-400" />
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
        title="Delete Habit"
        message="Are you sure you want to delete this habit? All completion history for this habit will be permanently removed."
        confirmLabel="Delete"
        confirmDanger
      />
    </div>
  );
};
