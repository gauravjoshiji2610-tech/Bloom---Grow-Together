import type { UserId, DayProgress, CategoryStats, HabitCategory } from '../types';
import { storageService } from './storageService';
import { computeStreak, isScheduledOnDate } from './habitService';


const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: '#10B981',
  fitness: '#7C3AED',
  mindfulness: '#6366F1',
  learning: '#F59E0B',
  creativity: '#EC4899',
  social: '#06B6D4',
  finance: '#84CC16',
  productivity: '#F97316',
  nutrition: '#14B8A6',
  sleep: '#8B5CF6',
  other: '#6B7280',
};

export const analyticsService = {
  async getDayProgress(userId: UserId, days = 30): Promise<DayProgress[]> {
    const result: DayProgress[] = [];
    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();
    const userHabits = habits.filter(h => h.userId === userId && !h.isArchived);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const habitsForDay = userHabits.filter(h => isScheduledOnDate(h, date));


      const completed = habitsForDay.filter(h => {
        const log = logs.find(l => l.habitId === h.id && l.date === date && l.completed);
        return !!log;
      }).length;

      const total = habitsForDay.length;
      result.push({
        date,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }
    return result;
  },

  async getCategoryStats(userId: UserId): Promise<CategoryStats[]> {
    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();
    const userHabits = habits.filter(h => h.userId === userId && !h.isArchived);
    const categoryMap = new Map<HabitCategory, { total: number; completed: number }>();

    userHabits.forEach(habit => {
      if (!categoryMap.has(habit.category)) {
        categoryMap.set(habit.category, { total: 0, completed: 0 });
      }
      const entry = categoryMap.get(habit.category)!;
      const habitLogs = logs.filter(l => l.habitId === habit.id);
      entry.total += habitLogs.length;
      entry.completed += habitLogs.filter(l => l.completed).length;
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      color: CATEGORY_COLORS[category],
    })).sort((a, b) => b.percentage - a.percentage);
  },

  async getOverallStreak(userId: UserId): Promise<{ current: number; longest: number }> {
    const habits = storageService.getHabits();
    const logs = storageService.getHabitLogs();
    const userHabits = habits.filter(h => h.userId === userId && !h.isArchived);

    let maxCurrent = 0;
    let maxLongest = 0;

    for (const habit of userHabits) {
      const streakData = computeStreak(habit.id, logs, habit);
      if (streakData.current > maxCurrent) maxCurrent = streakData.current;
      if (streakData.longest > maxLongest) maxLongest = streakData.longest;
    }

    return { current: maxCurrent, longest: maxLongest };
  },

  async getWeeklyStats(userId: UserId): Promise<DayProgress[]> {
    return this.getDayProgress(userId, 7);
  },

  async getMonthlyStats(userId: UserId): Promise<DayProgress[]> {
    return this.getDayProgress(userId, 30);
  },

  async get90DayHeatmap(userId: UserId): Promise<DayProgress[]> {
    return this.getDayProgress(userId, 90);
  },
};
