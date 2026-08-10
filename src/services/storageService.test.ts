import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from './storageService';
import { GAURAV_ID, RADHIKA_ID } from '../data/mockData';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should retrieve default user profiles when storage is empty', () => {
    const users = storageService.getUsers();
    expect(users[GAURAV_ID]).toBeDefined();
    expect(users[GAURAV_ID].name).toBe('Gaurav');
    expect(users[RADHIKA_ID]).toBeDefined();
    expect(users[RADHIKA_ID].name).toBe('Radhika');
  });

  it('should persist user profile updates to local storage', () => {
    const users = storageService.getUsers();
    users[GAURAV_ID].bio = 'Updated test bio!';
    storageService.saveUsers(users);

    const reloadedUsers = storageService.getUsers();
    expect(reloadedUsers[GAURAV_ID].bio).toBe('Updated test bio!');
  });

  it('should start with empty habits array when storage is uninitialized', () => {
    const habits = storageService.getHabits();
    expect(habits).toEqual([]);
  });

  it('should persist new habit creation cleanly', () => {
    const habits = storageService.getHabits();

    habits.push({
      id: 'test-h1',
      userId: GAURAV_ID,
      name: 'Test Habit',
      description: 'Unit test habit',
      category: 'productivity',
      icon: '🧪',
      color: '#7C3AED',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '12:00',
      priority: 'high',
      goal: 'Test goal',
      notes: '',
      reminderEnabled: false,
      reminderTime: '12:00',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    storageService.saveHabits(habits);

    const reloadedHabits = storageService.getHabits();
    expect(reloadedHabits.length).toBe(1);
    expect(reloadedHabits[0].name).toBe('Test Habit');
  });

  it('should clear local cache cleanly', () => {
    storageService.saveHabits([{
      id: 'dummy',
      userId: GAURAV_ID,
      name: 'Dummy',
      description: '',
      category: 'other',
      icon: '❓',
      color: '#000000',
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      time: '00:00',
      priority: 'low',
      goal: '',
      notes: '',
      reminderEnabled: false,
      reminderTime: '00:00',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);

    storageService.clearLocalCache();

    const resetHabits = storageService.getHabits();
    expect(resetHabits).toEqual([]);
  });
});
