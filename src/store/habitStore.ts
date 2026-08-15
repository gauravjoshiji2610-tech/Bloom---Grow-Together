import { create } from 'zustand';
import type { Habit, HabitWithLog, UserId, SharedHabitRequest } from '../types';
import { habitService } from '../services/habitService';

interface HabitState {
  habits: HabitWithLog[];
  receivedRequests: SharedHabitRequest[];
  sentRequests: SharedHabitRequest[];
  isLoading: boolean;
  error: string | null;
  todayProgress: { total: number; completed: number; percentage: number };
  loadHabits: (userId: UserId) => Promise<void>;
  loadRequests: (userId: UserId, partnerId: UserId) => Promise<void>;
  shareHabit: (
    senderId: UserId,
    senderName: string,
    recipientId: UserId,
    recipientName: string,
    habitData: SharedHabitRequest['habitData']
  ) => Promise<void>;
  acceptRequest: (request: SharedHabitRequest, recipientId: UserId) => Promise<void>;
  declineRequest: (request: SharedHabitRequest) => Promise<void>;
  setReceivedRequests: (requests: SharedHabitRequest[]) => void;
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
  receivedRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,
  todayProgress: { total: 0, completed: 0, percentage: 0 },

  loadRequests: async (userId: UserId, partnerId: UserId) => {
    try {
      const [received, sent] = await Promise.all([
        habitService.getReceivedRequests(userId),
        habitService.getSentRequests(userId, partnerId),
      ]);
      set({ receivedRequests: received, sentRequests: sent });
    } catch (e: any) {
      console.warn('Failed to load shared habit requests:', e);
    }
  },

  setReceivedRequests: (requests: SharedHabitRequest[]) => {
    set({ receivedRequests: requests });
  },

  shareHabit: async (senderId, senderName, recipientId, recipientName, habitData) => {
    try {
      const newReq = await habitService.sendShareRequest(senderId, senderName, recipientId, recipientName, habitData);
      set(state => ({
        sentRequests: [newReq, ...state.sentRequests.filter(r => r.id !== newReq.id)],
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  acceptRequest: async (request, recipientId) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.acceptShareRequest(request, recipientId);
      await get().loadHabits(recipientId);
      set(state => ({
        receivedRequests: state.receivedRequests.map(r =>
          r.id === request.id ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() } : r
        ),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  declineRequest: async (request) => {
    try {
      await habitService.declineShareRequest(request);
      set(state => ({
        receivedRequests: state.receivedRequests.map(r =>
          r.id === request.id ? { ...r, status: 'declined' as const, respondedAt: new Date().toISOString() } : r
        ),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

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
