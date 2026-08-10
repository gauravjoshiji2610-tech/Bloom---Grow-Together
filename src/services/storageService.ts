import type { User, Habit, HabitLog, ActivityEvent, PartnerInteraction } from '../types';
import { defaultUsers } from '../data/mockData';

const KEYS = {
  USERS: 'bloom_users',
  HABITS: 'bloom_habits',
  HABIT_LOGS: 'bloom_habit_logs',
  ACTIVITY_FEED: 'bloom_activity_feed',
  INTERACTIONS: 'bloom_interactions',
  SESSION: 'bloom_session',
  CLEAN_VERSION: 'bloom_clean_v2',
};

const LEGACY_HABIT_IDS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'h11', 'h12']);

// Force purge legacy seed items from browser localStorage once
(function purgeLegacyData() {
  try {
    const version = localStorage.getItem(KEYS.CLEAN_VERSION);
    if (version !== 'v2') {
      localStorage.removeItem(KEYS.HABITS);
      localStorage.removeItem(KEYS.HABIT_LOGS);
      localStorage.removeItem(KEYS.ACTIVITY_FEED);
      localStorage.removeItem(KEYS.INTERACTIONS);
      localStorage.removeItem(KEYS.USERS);
      localStorage.setItem(KEYS.CLEAN_VERSION, 'v2');
    }
  } catch (e) {
    console.warn('Could not purge legacy localStorage:', e);
  }
})();

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export const storageService = {
  // Users / Profiles
  getUsers(): Record<string, User> {
    const rawUsers = getItem(KEYS.USERS, defaultUsers);
    // Sanitize any legacy mock emails/bios if present in old localStorage
    Object.keys(rawUsers).forEach(id => {
      if (rawUsers[id].email === 'gaurav@bloom.app' || rawUsers[id].email === 'radhika@bloom.app') {
        rawUsers[id].email = '';
      }
      if (rawUsers[id].bio && (rawUsers[id].bio.includes('Building habits') || rawUsers[id].bio.includes('Growing every single day'))) {
        rawUsers[id].bio = '';
      }
    });
    return rawUsers;
  },
  saveUsers(users: Record<string, User>): void {
    setItem(KEYS.USERS, users);
  },

  // Habits
  getHabits(): Habit[] {
    const habits = getItem<Habit[]>(KEYS.HABITS, []);
    // Filter out any legacy mock habit IDs
    const cleanHabits = habits.filter(h => !LEGACY_HABIT_IDS.has(h.id));
    if (cleanHabits.length !== habits.length) {
      this.saveHabits(cleanHabits);
    }
    return cleanHabits;
  },
  saveHabits(habits: Habit[]): void {
    setItem(KEYS.HABITS, habits.filter(h => !LEGACY_HABIT_IDS.has(h.id)));
  },

  // Habit Logs
  getHabitLogs(): HabitLog[] {
    const logs = getItem<HabitLog[]>(KEYS.HABIT_LOGS, []);
    const cleanLogs = logs.filter(l => !LEGACY_HABIT_IDS.has(l.habitId));
    if (cleanLogs.length !== logs.length) {
      this.saveHabitLogs(cleanLogs);
    }
    return cleanLogs;
  },
  saveHabitLogs(logs: HabitLog[]): void {
    setItem(KEYS.HABIT_LOGS, logs.filter(l => !LEGACY_HABIT_IDS.has(l.habitId)));
  },

  // Activity Feed
  getActivityFeed(): ActivityEvent[] {
    const events = getItem<ActivityEvent[]>(KEYS.ACTIVITY_FEED, []);
    const cleanEvents = events.filter(e => !e.habitId || !LEGACY_HABIT_IDS.has(e.habitId));
    if (cleanEvents.length !== events.length) {
      this.saveActivityFeed(cleanEvents);
    }
    return cleanEvents;
  },
  saveActivityFeed(events: ActivityEvent[]): void {
    setItem(KEYS.ACTIVITY_FEED, events.filter(e => !e.habitId || !LEGACY_HABIT_IDS.has(e.habitId)));
  },

  // Partner Interactions
  getInteractions(): PartnerInteraction[] {
    return getItem(KEYS.INTERACTIONS, []);
  },
  saveInteractions(interactions: PartnerInteraction[]): void {
    setItem(KEYS.INTERACTIONS, interactions);
  },

  // Clear local cache
  clearLocalCache(): void {
    localStorage.removeItem(KEYS.HABITS);
    localStorage.removeItem(KEYS.HABIT_LOGS);
    localStorage.removeItem(KEYS.ACTIVITY_FEED);
    localStorage.removeItem(KEYS.INTERACTIONS);
  },
};
