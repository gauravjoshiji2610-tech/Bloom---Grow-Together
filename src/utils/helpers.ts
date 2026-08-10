import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    health: 'Health',
    fitness: 'Fitness',
    mindfulness: 'Mindfulness',
    learning: 'Learning',
    creativity: 'Creativity',
    social: 'Social',
    finance: 'Finance',
    productivity: 'Productivity',
    nutrition: 'Nutrition',
    sleep: 'Sleep',
    other: 'Other',
  };
  return map[category] || category;
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
  return map[priority] || priority;
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  };
  return map[priority] || '#6B7280';
}

export function getDayName(dayIndex: number, short = false): string {
  const days = short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const HABIT_ICONS = [
  '💪', '📚', '🧘', '💧', '✍️', '🏃', '🎨', '🎵',
  '🌿', '🍎', '💊', '🌙', '☀️', '🧠', '💰', '🤝',
  '📝', '🎯', '🏋️', '🚴', '🏊', '🧗', '⚽', '🎾',
  '🍳', '🌱', '📸', '🎮', '🔬', '🗺️', '🎤', '🌊',
];

export const HABIT_COLORS = [
  '#7C3AED', '#F59E0B', '#10B981', '#EF4444',
  '#06B6D4', '#EC4899', '#6366F1', '#F97316',
  '#84CC16', '#14B8A6', '#8B5CF6', '#F43F5E',
];
