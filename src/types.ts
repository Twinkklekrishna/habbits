export type Frequency = 'daily' | 'weekly';

export interface HabitCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  plannedAt: number; // Timestamp when it was planned
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  time: string; // HH:mm
  frequency: Frequency;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  completions: Record<string, HabitCompletion>; // Key is YYYY-MM-DD
  createdAt: number;
}

export interface DayProgress {
  date: string;
  completions: string[]; // habit IDs
}

export interface NotificationPrefs {
  enabled: boolean;
  reminderInterval: number; // minutes after original time for "big alert"
}

export interface NoteItem {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}
