export type UserId = 'IQewhJrjzzVORIjYuOKn1Lau8MG3' | '5udg1iXlBVUctWsd0nMzT2LQECt2';

export interface User {
  uid: UserId;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  dateOfBirth: string;
  interests: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'mindfulness'
  | 'learning'
  | 'creativity'
  | 'social'
  | 'finance'
  | 'productivity'
  | 'nutrition'
  | 'sleep'
  | 'other';

export type HabitPriority = 'low' | 'medium' | 'high';
export type RepeatType = 'daily' | 'weekly' | 'custom';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitRecurrence {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  interval: number;       // 1 = every day/week/month, 2 = every 2nd, etc.
  weekDays: number[];     // [0-6] Sun–Sat, used when frequency='weekly'
  monthDay: number;       // 1–31, day of month when frequency='monthly'
  endDate: string | null; // YYYY-MM-DD or null (no end)
  startDate: string;      // YYYY-MM-DD — epoch for interval math
}

export interface Habit {
  id: string;
  userId: UserId;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string;
  color: string;
  repeatType: RepeatType;
  selectedDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  time: string; // HH:MM
  priority: HabitPriority;
  goal: string;
  notes: string;
  reminderEnabled: boolean;
  reminderTime: string;
  isArchived: boolean;
  recurrence?: HabitRecurrence; // optional — missing means old habit, uses repeatType/selectedDays
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: UserId;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string | null;
  proofPhoto: string | null;
  notes: string;
  mood: number | null; // 1-5
}

export interface HabitWithLog extends Habit {
  todayLog: HabitLog | null;
  streak: number;
  longestStreak: number;
  completionRate: number; // 0-100
}

export type ActivityType =
  | 'habit_completed'
  | 'habit_undone'
  | 'habit_created'
  | 'habit_edited'
  | 'habit_archived'
  | 'habit_restored'
  | 'proof_uploaded'
  | 'partner_nudge'
  | 'partner_cheer'
  | 'partner_message'
  | 'streak_milestone'
  | 'profile_updated'
  | 'habit_shared'
  | 'habit_accepted'
  | 'habit_declined';

export type SharedHabitRequestStatus = 'pending' | 'accepted' | 'declined';

export interface SharedHabitRequest {
  id: string;
  senderId: UserId;
  senderName: string;
  recipientId: UserId;
  recipientName: string;
  status: SharedHabitRequestStatus;
  createdAt: string;
  respondedAt?: string;
  habitData: {
    name: string;
    description: string;
    category: HabitCategory;
    icon: string;
    color: string;
    repeatType: RepeatType;
    selectedDays: number[];
    time: string;
    priority: HabitPriority;
    goal: string;
    notes: string;
    reminderEnabled: boolean;
    reminderTime: string;
    isArchived?: boolean;
    recurrence?: HabitRecurrence;
  };
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actorId: UserId;
  targetId?: UserId;
  habitId?: string;
  habitName?: string;
  message?: string;
  proofPhoto?: string;
  milestone?: number;
  createdAt: string;
}

export interface PartnerInteraction {
  id: string;
  fromUserId: UserId;
  toUserId: UserId;
  type: 'nudge' | 'cheer' | 'message';
  message: string;
  emoji?: string;
  createdAt: string;
  read: boolean;
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

export interface DayProgress {
  date: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface CategoryStats {
  category: HabitCategory;
  total: number;
  completed: number;
  percentage: number;
  color: string;
}

export interface NotificationPreferences {
  userId: UserId;
  remindersEnabled: boolean;
  partnerNudgeEnabled: boolean;
  streakAlertsEnabled: boolean;
  weeklyReportEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export type ThemeMode = 'dark';

export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
}
