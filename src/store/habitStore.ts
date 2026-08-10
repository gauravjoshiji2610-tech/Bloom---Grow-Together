import { create } from 'zustand';
import type { Habit, HabitWithLog, UserId } from '../types';
import { habitService } from '../services/habitService';

interface HabitState {
  habits: HabitWithLog[];
  isLoading: boolean;
  error: string | null;
  todayProgress: { total: number; completed: number; percentage: number };
  loadHabits: (userId: UserId) => Promise<void>;
  createHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string, userId: UserId) => Promise<void>;
  undoCompletion: (habitId: string, userId: UserId) => Promise<void>;
  refreshProgress: (userId: UserId) => Promise<void>;
  clearError: () => void;
}

export const useHabitStore = create<HabitState>()((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,
  todayProgress: { total: 0, completed: 0, percentage: 0 },

  loadHabits: async (userId: UserId) => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitService.getHabits(userId);
      const progress = await habitService.getTodayProgress(userId);
      set({ habits, todayProgress: progress, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createHabit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.createHabit(data);
      await get().loadHabits(data.userId);
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateHabit: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const habit = get().habits.find(h => h.id === id);
      await habitService.updateHabit(id, updates);
      if (habit) await get().loadHabits(habit.userId);
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  deleteHabit: async (id) => {
    try {
      const habit = get().habits.find(h => h.id === id);
      await habitService.deleteHabit(id);
      if (habit) await get().loadHabits(habit.userId);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  archiveHabit: async (id) => {
    try {
      const habit = get().habits.find(h => h.id === id);
      await habitService.archiveHabit(id);
      if (habit) await get().loadHabits(habit.userId);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  restoreHabit: async (id) => {
    try {
      const habit = get().habits.find(h => h.id === id);
      await habitService.restoreHabit(id);
      if (habit) await get().loadHabits(habit.userId);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  completeHabit: async (habitId, userId) => {
    try {
      await habitService.completeHabit(habitId, userId);
      await get().loadHabits(userId);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  undoCompletion: async (habitId, userId) => {
    try {
      await habitService.undoCompletion(habitId, userId);
      await get().loadHabits(userId);
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  refreshProgress: async (userId: UserId) => {
    const progress = await habitService.getTodayProgress(userId);
    set({ todayProgress: progress });
  },

  clearError: () => set({ error: null }),
}));
