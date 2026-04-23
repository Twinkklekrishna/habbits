import { useState, useEffect } from 'react';
import { Habit, HabitCompletion } from '../types.ts';

const STORAGE_KEY = 'orbit_habits_v2'; // Bumped version for new schema

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const addHabit = (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      completions: {}
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const planHabitForDate = (habitId: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          completions: {
            ...habit.completions,
            [date]: habit.completions[date] || {
              date,
              completed: false,
              plannedAt: Date.now()
            }
          }
        };
      }
      return habit;
    }));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const updateCompletion = (habitId: string, date: string, completed: boolean, notes?: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          completions: {
            ...habit.completions,
            [date]: {
              ...(habit.completions[date] || { date, plannedAt: Date.now() }),
              completed,
              notes
            }
          }
        };
      }
      return habit;
    }));
  };

  const getStats = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { streak: 0, total: 0 };
    
    const dates = Object.keys(habit.completions).sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 0; i < dates.length; i++) {
        const comp = habit.completions[dates[i]];
        if (!comp.completed) continue;

        const completionDate = new Date(dates[i]);
        const diff = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diff === streak || diff === streak + 1) {
            streak++;
        } else {
            break;
        }
    }

    return {
      streak,
      total: Object.values(habit.completions).filter(c => (c as HabitCompletion).completed).length
    };
  };

  return { habits, addHabit, deleteHabit, updateCompletion, planHabitForDate, getStats };
}
