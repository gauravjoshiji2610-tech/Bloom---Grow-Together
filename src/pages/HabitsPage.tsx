import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Archive, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHabitStore } from '../store/habitStore';
import { HabitCard } from '../components/HabitCard';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Habit, HabitWithLog, HabitCategory, HabitPriority, RepeatType } from '../types';
import { HABIT_ICONS, HABIT_COLORS, getCategoryLabel, getDayName } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES: HabitCategory[] = [
  'health','fitness','mindfulness','learning','creativity',
  'social','finance','productivity','nutrition','sleep','other'
];

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
});

export const HabitsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { habits, isLoading, loadHabits, createHabit, updateHabit, deleteHabit, archiveHabit, restoreHabit, completeHabit, undoCompletion } = useHabitStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null);
  const [form, setForm] = useState(() => defaultForm(currentUser?.uid || ''));
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) loadHabits(currentUser.uid);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('action') === 'new') {
      openNewForm();
      setSearchParams({});
    }
  }, [searchParams]);

  const openNewForm = () => {
    setEditingHabit(null);
    setForm(defaultForm(currentUser?.uid || ''));
    setFormOpen(true);
  };

  const openEditForm = (habit: HabitWithLog) => {
    setEditingHabit(habit);
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
        toast.success('Habit created! 🌱');
      }
      setFormOpen(false);
    } catch {
      toast.error('Failed to save habit');
    } finally {
      setIsSubmitting(false);
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

  const toggleDay = (day: number) => {
    setForm(f => {
      const selectedDays = f.selectedDays.includes(day)
        ? f.selectedDays.filter(d => d !== day)
        : [...f.selectedDays, day].sort();
      return { ...f, selectedDays };
    });
  };

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
          <div>
            <label className="label">Habit Name *</label>
            <input
              type="text" required placeholder="e.g., Morning Workout, Read 30 mins..."
              className="input-field" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <input
              type="text" placeholder="Why is this habit important?"
              className="input-field" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

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

          {/* Repeat Schedule */}
          <div>
            <label className="label">Frequency</label>
            <select
              className="input-field text-sm mb-3"
              value={form.repeatType}
              onChange={e => setForm(f => ({ ...f, repeatType: e.target.value as RepeatType }))}
            >
              <option value="daily">Every Day</option>
              <option value="weekly">Specific Days</option>
            </select>

            {form.repeatType !== 'daily' && (
              <div className="flex justify-between gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <button
                    key={day} type="button"
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={form.selectedDays.includes(day) ? { background: '#8B5CF6', color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#71717A' }}
                    onClick={() => toggleDay(day)}
                  >
                    {getDayName(day, true)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Target Time</label>
            <input
              type="time" className="input-field"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>

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
