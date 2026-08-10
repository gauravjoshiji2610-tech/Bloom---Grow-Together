import { describe, it, expect, beforeEach } from 'vitest';
import { habitService, computeStreak } from './habitService';
import { GAURAV_ID } from '../data/mockData';
import type { Habit, HabitLog } from '../types';

describe('habitService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty array for user with no habits in Firestore', async () => {
    const habits = await habitService.getHabits(GAURAV_ID);
    expect(habits).toEqual([]);
  });

  it('should create a new habit and persist it', async () => {
    const newHabit = await habitService.createHabit({
      userId: GAURAV_ID,
      name: 'Read Research Papers',
      description: 'Daily reading',
      category: 'learning',
      icon: '🔬',
      color: '#8B5CF6',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '14:00',
      priority: 'high',
      goal: 'Read 50 papers',
      notes: '',
      reminderEnabled: true,
      reminderTime: '13:50',
      isArchived: false,
    });

    expect(newHabit.id).toBeDefined();

    const habits = await habitService.getHabits(GAURAV_ID);
    const found = habits.find(h => h.id === newHabit.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Read Research Papers');
  });

  it('should complete a habit and calculate streak accurately', async () => {
    const target = await habitService.createHabit({
      userId: GAURAV_ID,
      name: 'Daily Yoga',
      description: '',
      category: 'fitness',
      icon: '🧘',
      color: '#10B981',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '07:00',
      priority: 'medium',
      goal: '',
      notes: '',
      reminderEnabled: false,
      reminderTime: '07:00',
      isArchived: false,
    });

    const log = await habitService.completeHabit(target.id, GAURAV_ID);
    expect(log.completed).toBe(true);
    expect(log.habitId).toBe(target.id);

    const updatedHabits = await habitService.getHabits(GAURAV_ID);
    const updatedTarget = updatedHabits.find(h => h.id === target.id);
    expect(updatedTarget?.todayLog?.completed).toBe(true);
    expect(updatedTarget?.streak).toBe(1);
  });

  it('should undo habit completion cleanly', async () => {
    const target = await habitService.createHabit({
      userId: GAURAV_ID,
      name: 'Water Plants',
      description: '',
      category: 'other',
      icon: '🪴',
      color: '#06B6D4',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '09:00',
      priority: 'low',
      goal: '',
      notes: '',
      reminderEnabled: false,
      reminderTime: '09:00',
      isArchived: false,
    });

    await habitService.completeHabit(target.id, GAURAV_ID);
    await habitService.undoCompletion(target.id, GAURAV_ID);

    const updatedHabits = await habitService.getHabits(GAURAV_ID);
    const updatedTarget = updatedHabits.find(h => h.id === target.id);
    expect(updatedTarget?.todayLog).toBeNull();
  });

  it('should compute streaks deterministically', () => {
    const habit: Habit = {
      id: 'h-streak',
      userId: GAURAV_ID,
      name: 'Streak Test',
      description: '',
      category: 'fitness',
      icon: '💪',
      color: '#8B5CF6',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '08:00',
      priority: 'medium',
      goal: '',
      notes: '',
      reminderEnabled: false,
      reminderTime: '08:00',
      isArchived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const logs: HabitLog[] = [
      { id: 'l1', habitId: habit.id, userId: GAURAV_ID, date: todayStr, completed: true, completedAt: new Date().toISOString(), proofPhoto: null, notes: '', mood: null },
      { id: 'l2', habitId: habit.id, userId: GAURAV_ID, date: yesterdayStr, completed: true, completedAt: new Date().toISOString(), proofPhoto: null, notes: '', mood: null },
    ];

    const result = computeStreak(habit.id, logs, habit);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });
});
