import type { Habit, HabitLog, HabitWithLog, UserId, ActivityType, SharedHabitRequest, HabitRecurrence } from '../types';
import { activityService } from './activityService';
import { storageService } from './storageService';
import { db } from './firebase';
import { doc, collection, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Single source of truth for whether a habit is scheduled on a given date.
 * Handles both new recurrence-based habits and legacy repeatType/selectedDays habits.
 */
export function isScheduledOnDate(habit: Habit, dateStr: string): boolean {
  const msPerDay = 1000 * 60 * 60 * 24;
  // Use UTC noon to avoid any DST shift issues
  const toUTC = (s: string) => new Date(s + 'T12:00:00Z').getTime();

  if (habit.recurrence?.enabled) {
    const rec = habit.recurrence;

    // Before epoch: not scheduled
    if (dateStr < rec.startDate) return false;

    // Past end date: not scheduled
    if (rec.endDate && dateStr > rec.endDate) return false;

    if (rec.frequency === 'daily') {
      const daysDiff = Math.round((toUTC(dateStr) - toUTC(rec.startDate)) / msPerDay);
      return daysDiff >= 0 && daysDiff % rec.interval === 0;
    }

    if (rec.frequency === 'weekly') {
      const dateObj = new Date(dateStr + 'T12:00:00Z');
      const dayOfWeek = dateObj.getUTCDay();
      if (!rec.weekDays.includes(dayOfWeek)) return false;
      // Align to the Sunday of the start-date's week for consistent interval counting
      const startTs = toUTC(rec.startDate);
      const startSunday = startTs - new Date(rec.startDate + 'T12:00:00Z').getUTCDay() * msPerDay;
      const dateSunday = toUTC(dateStr) - dayOfWeek * msPerDay;
      const weeksDiff = Math.round((dateSunday - startSunday) / (msPerDay * 7));
      return weeksDiff >= 0 && weeksDiff % rec.interval === 0;
    }

    if (rec.frequency === 'monthly') {
      const dateObj = new Date(dateStr + 'T12:00:00Z');
      const startObj = new Date(rec.startDate + 'T12:00:00Z');
      if (dateObj.getUTCDate() !== rec.monthDay) return false;
      const monthsDiff =
        (dateObj.getUTCFullYear() - startObj.getUTCFullYear()) * 12 +
        (dateObj.getUTCMonth() - startObj.getUTCMonth());
      return monthsDiff >= 0 && monthsDiff % rec.interval === 0;
    }

    return false;
  }

  // Legacy fallback: no recurrence or recurrence disabled — use repeatType/selectedDays
  const dayOfWeek = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  if (habit.repeatType === 'daily') return true;
  return habit.selectedDays?.includes(dayOfWeek) ?? false;
}

export function computeStreak(habitId: string, logs: HabitLog[], habit: Habit): { current: number; longest: number } {
  const completedDates = new Set(
    logs
      .filter(l => l.habitId === habitId && l.completed)
      .map(l => l.date)
  );

  if (completedDates.size === 0) return { current: 0, longest: 0 };

  const today = todayStr();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];

    const shouldRun = isScheduledOnDate(habit, dateStr);

    if (!shouldRun) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const isCompleted = completedDates.has(dateStr);

    if (isCompleted) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (currentStreak === tempStreak - 1) {
        currentStreak = tempStreak;
      }
    } else {
      if (dateStr === today) {
        // Not completed today yet
      } else {
        if (currentStreak === 0 && tempStreak > 0) {
          currentStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  if (currentStreak === 0 && tempStreak > 0) {
    currentStreak = tempStreak;
  }

  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

function computeCompletionRate(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter(l => l.habitId === habitId);
  if (habitLogs.length === 0) return 0;
  const completed = habitLogs.filter(l => l.completed).length;
  return Math.round((completed / habitLogs.length) * 100);
}

export const habitService = {
  async getHabits(userId: UserId): Promise<HabitWithLog[]> {
    await this.syncFirestoreHabits(userId);
    await this.syncFirestoreLogs(userId);

    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();
    const today = todayStr();

    return habits
      .filter(h => h.userId === userId)
      .map(habit => {
        const todayLog = logs.find(l => l.habitId === habit.id && l.date === today && l.completed) || null;
        const streakData = computeStreak(habit.id, logs, habit);
        const completionRate = computeCompletionRate(habit.id, logs);
        return {
          ...habit,
          todayLog,
          streak: streakData.current,
          longestStreak: streakData.longest,
          completionRate,
        };
      });
  },

  async syncFirestoreHabits(userId: UserId): Promise<void> {
    try {
      const habitsCol = collection(db, 'users', userId, 'habits');
      const snap = await getDocs(habitsCol);
      const remoteHabits = snap ? snap.docs.map(docSnap => docSnap.data() as Habit) : [];
      const otherUserHabits = storageService.getHabits().filter(h => h.userId !== userId);
      const merged = otherUserHabits.concat(remoteHabits);
      storageService.saveHabits(merged);
    } catch (e) {
      console.warn('Firestore habit sync offline fallback:', e);
    }
  },

  async syncFirestoreLogs(userId: UserId): Promise<void> {
    try {
      const logsCol = collection(db, 'users', userId, 'habitLogs');
      const snap = await getDocs(logsCol);
      const remoteLogs = snap ? snap.docs.map(docSnap => docSnap.data() as HabitLog) : [];
      const otherUserLogs = storageService.getHabitLogs().filter(l => l.userId !== userId);
      const merged = otherUserLogs.concat(remoteLogs);
      storageService.saveHabitLogs(merged);
    } catch (e) {
      console.warn('Firestore logs sync offline fallback:', e);
    }
  },

  async createHabit(habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const habits = storageService.getHabits();
    const habitId = 'h' + Date.now();
    const newHabit: Habit = {
      ...habitData,
      id: habitId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'users', habitData.userId, 'habits', habitId);
      await setDoc(docRef, newHabit);
    } catch (e) {
      console.warn('Firestore createHabit offline fallback:', e);
    }

    habits.push(newHabit);
    storageService.saveHabits(habits);

    activityService.addEvent({
      type: 'habit_created',
      actorId: habitData.userId,
      habitId: newHabit.id,
      habitName: newHabit.name,
    });

    return newHabit;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const habits = storageService.getHabits();
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Habit not found');

    const updated = { ...habits[idx], ...updates, updatedAt: new Date().toISOString() };

    try {
      const docRef = doc(db, 'users', updated.userId, 'habits', id);
      await setDoc(docRef, updated, { merge: true });
    } catch (e) {
      console.warn('Firestore updateHabit offline fallback:', e);
    }

    habits[idx] = updated;
    storageService.saveHabits(habits);

    activityService.addEvent({
      type: 'habit_edited' as ActivityType,
      actorId: updated.userId,
      habitId: id,
      habitName: updated.name,
    });

    return updated;
  },

  async deleteHabit(id: string): Promise<void> {
    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();

    const habit = habits.find(h => h.id === id);
    if (habit) {
      try {
        const docRef = doc(db, 'users', habit.userId, 'habits', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore deleteHabit offline fallback:', e);
      }

      activityService.addEvent({
        type: 'habit_archived',
        actorId: habit.userId,
        habitId: id,
        habitName: habit.name,
      });
    }

    const remainingHabits = habits.filter(h => h.id !== id);
    const remainingLogs = logs.filter(l => l.habitId !== id);

    storageService.saveHabits(remainingHabits);
    storageService.saveHabitLogs(remainingLogs);
  },

  async archiveHabit(id: string): Promise<void> {
    await this.updateHabit(id, { isArchived: true });
  },

  async restoreHabit(id: string): Promise<void> {
    await this.updateHabit(id, { isArchived: false });
  },

  async completeHabit(habitId: string, userId: UserId, proofPhoto?: string): Promise<HabitLog> {
    const today = todayStr();
    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();

    const habit = habits.find(h => h.id === habitId);
    const logId = `log-${habitId}-${today}`;

    const newLog: HabitLog = {
      id: logId,
      habitId,
      userId,
      date: today,
      completed: true,
      completedAt: new Date().toISOString(),
      proofPhoto: proofPhoto || null,
      notes: '',
      mood: null,
    };

    try {
      const docRef = doc(db, 'users', userId, 'habitLogs', logId);
      await setDoc(docRef, newLog);
    } catch (e) {
      console.warn('Firestore completeHabit offline fallback:', e);
    }

    const existingIdx = logs.findIndex(l => l.habitId === habitId && l.date === today);
    if (existingIdx !== -1) {
      logs[existingIdx] = newLog;
    } else {
      logs.push(newLog);
    }

    storageService.saveHabitLogs(logs);

    activityService.addEvent({
      type: 'habit_completed',
      actorId: userId,
      habitId,
      habitName: habit?.name,
      proofPhoto: proofPhoto,
    });

    return newLog;
  },

  async undoCompletion(habitId: string, userId: UserId): Promise<void> {
    const today = todayStr();
    const logs = storageService.getHabitLogs();
    const habits = storageService.getHabits();
    const habit = habits.find(h => h.id === habitId);
    const logId = `log-${habitId}-${today}`;

    try {
      const docRef = doc(db, 'users', userId, 'habitLogs', logId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore undoCompletion offline fallback:', e);
    }

    const filteredLogs = logs.filter(l => !(l.habitId === habitId && l.date === today));
    storageService.saveHabitLogs(filteredLogs);

    activityService.addEvent({
      type: 'habit_undone',
      actorId: userId,
      habitId,
      habitName: habit?.name,
    });
  },

  async getLogs(userId: UserId, days = 90): Promise<HabitLog[]> {
    await this.syncFirestoreLogs(userId);
    const logs = storageService.getHabitLogs();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return logs.filter(l => l.userId === userId && l.date >= cutoffStr);
  },

  async getTodayProgress(userId: UserId): Promise<{ total: number; completed: number; percentage: number }> {
    const habits = await this.getHabits(userId);
    const active = habits.filter(h => !h.isArchived);
    const today = todayStr();
    const todayHabits = active.filter(h => isScheduledOnDate(h, today));


    const completedCount = todayHabits.filter(h => h.todayLog?.completed).length;
    const total = todayHabits.length;

    return {
      total,
      completed: completedCount,
      percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  },

  subscribeHabits(userId: UserId, callback: (habits: HabitWithLog[]) => void): () => void {
    try {
      const habitsCol = collection(db, 'users', userId, 'habits');
      const unsub = onSnapshot(habitsCol, async () => {
        const habits = await this.getHabits(userId);
        callback(habits);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore snapshot listener offline fallback:', e);
      return () => {};
    }
  },

  // ── Shared Habit Requests ───────────────────────────────
  async sendShareRequest(
    senderId: UserId,
    senderName: string,
    recipientId: UserId,
    recipientName: string,
    habitData: SharedHabitRequest['habitData']
  ): Promise<SharedHabitRequest> {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const newRequest: SharedHabitRequest = {
      id: requestId,
      senderId,
      senderName,
      recipientId,
      recipientName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      habitData,
    };

    try {
      const docRef = doc(db, 'users', recipientId, 'habitRequests', requestId);
      await setDoc(docRef, newRequest);
    } catch (e) {
      console.warn('Firestore sendShareRequest offline fallback:', e);
    }

    const requests = storageService.getHabitRequests();
    const existingIdx = requests.findIndex(r => r.id === requestId);
    if (existingIdx !== -1) {
      requests[existingIdx] = newRequest;
    } else {
      requests.unshift(newRequest);
    }
    storageService.saveHabitRequests(requests);

    activityService.addEvent({
      type: 'habit_shared',
      actorId: senderId,
      targetId: recipientId,
      habitName: habitData.name,
      message: `Shared "${habitData.name}" with ${recipientName}`,
    });

    return newRequest;
  },

  async syncFirestoreRequests(userId: UserId): Promise<void> {
    try {
      const requestsCol = collection(db, 'users', userId, 'habitRequests');
      const snap = await getDocs(requestsCol);
      const remoteRequests = snap ? snap.docs.map(docSnap => docSnap.data() as SharedHabitRequest) : [];
      const current = storageService.getHabitRequests();
      const map = new Map<string, SharedHabitRequest>();
      current.forEach(r => map.set(r.id, r));
      remoteRequests.forEach(r => map.set(r.id, r));
      storageService.saveHabitRequests(Array.from(map.values()));
    } catch (e) {
      console.warn('Firestore habitRequests sync offline fallback:', e);
    }
  },

  async getReceivedRequests(recipientId: UserId): Promise<SharedHabitRequest[]> {
    await this.syncFirestoreRequests(recipientId);
    const all = storageService.getHabitRequests();
    return all.filter(r => r.recipientId === recipientId);
  },

  async getSentRequests(senderId: UserId, partnerId: UserId): Promise<SharedHabitRequest[]> {
    await this.syncFirestoreRequests(partnerId);
    const all = storageService.getHabitRequests();
    return all.filter(r => r.senderId === senderId);
  },

  async acceptShareRequest(request: SharedHabitRequest, recipientId: UserId): Promise<Habit> {
    const today = todayStr();
    // Copy recurrence settings with startDate set to acceptance date
    const copiedRecurrence: HabitRecurrence | undefined = request.habitData.recurrence
      ? {
          ...request.habitData.recurrence,
          startDate: today, // Acceptance date per requirement!
        }
      : undefined;

    const newHabit = await this.createHabit({
      ...request.habitData,
      userId: recipientId,
      isArchived: false,
      recurrence: copiedRecurrence,
    });

    const updatedRequest: SharedHabitRequest = {
      ...request,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'users', request.recipientId, 'habitRequests', request.id);
      await setDoc(docRef, updatedRequest, { merge: true });
    } catch (e) {
      console.warn('Firestore acceptShareRequest offline fallback:', e);
    }

    const requests = storageService.getHabitRequests();
    const idx = requests.findIndex(r => r.id === request.id);
    if (idx !== -1) {
      requests[idx] = updatedRequest;
    } else {
      requests.push(updatedRequest);
    }
    storageService.saveHabitRequests(requests);

    activityService.addEvent({
      type: 'habit_accepted',
      actorId: recipientId,
      targetId: request.senderId,
      habitName: request.habitData.name,
      message: `Accepted shared habit "${request.habitData.name}" from ${request.senderName}`,
    });

    return newHabit;
  },

  async declineShareRequest(request: SharedHabitRequest): Promise<void> {
    const updatedRequest: SharedHabitRequest = {
      ...request,
      status: 'declined',
      respondedAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'users', request.recipientId, 'habitRequests', request.id);
      await setDoc(docRef, updatedRequest, { merge: true });
    } catch (e) {
      console.warn('Firestore declineShareRequest offline fallback:', e);
    }

    const requests = storageService.getHabitRequests();
    const idx = requests.findIndex(r => r.id === request.id);
    if (idx !== -1) {
      requests[idx] = updatedRequest;
    } else {
      requests.push(updatedRequest);
    }
    storageService.saveHabitRequests(requests);

    activityService.addEvent({
      type: 'habit_declined',
      actorId: request.recipientId,
      targetId: request.senderId,
      habitName: request.habitData.name,
      message: `Declined shared habit request "${request.habitData.name}"`,
    });
  },

  subscribeHabitRequests(userId: UserId, callback: (requests: SharedHabitRequest[]) => void): () => void {
    try {
      const col = collection(db, 'users', userId, 'habitRequests');
      const unsub = onSnapshot(col, (snap) => {
        if (!snap.empty) {
          const remote = snap.docs.map(docSnap => docSnap.data() as SharedHabitRequest);
          const current = storageService.getHabitRequests();
          const map = new Map<string, SharedHabitRequest>();
          current.forEach(r => map.set(r.id, r));
          remote.forEach(r => map.set(r.id, r));
          const merged = Array.from(map.values());
          storageService.saveHabitRequests(merged);
          callback(merged.filter(r => r.recipientId === userId));
        } else {
          callback([]);
        }
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore habitRequests snapshot offline fallback:', e);
      return () => {};
    }
  },
};
