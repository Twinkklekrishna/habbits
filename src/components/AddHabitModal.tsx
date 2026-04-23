import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Clock, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Habit, Frequency } from '../types.ts';
import { formatISO } from '../lib/utils.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void;
  habits: Habit[];
  planHabitForDate: (habitId: string, date: string) => void;
  now: Date;
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#475569' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AddHabitModal({ isOpen, onClose, onAdd, habits, planHabitForDate, now }: Props) {
  const [activeTab, setActiveTab] = useState<'plan' | 'new'>(habits.length > 0 ? 'plan' : 'new');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[5].value);
  const [time, setTime] = useState('08:00');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const tomorrow = () => {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return formatISO(d);
  };

  const handleCreateNew = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      color,
      icon: 'Target',
      time,
      frequency,
      daysOfWeek: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
    });
    setName('');
    onClose();
  };

  const handlePlanExisting = (habitId: string) => {
    planHabitForDate(habitId, tomorrow());
    onClose();
  };

  const toggleDay = (index: number) => {
    setDaysOfWeek(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
         <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-orbit-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/10"
              id="add-habit-modal"
            >
              <div className="p-6 border-b border-slate-800 flex flex-col bg-slate-900/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Morning Setup</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Defining tomorrow's intentions
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setActiveTab('plan')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'plan' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Legacy Tasks
                  </button>
                  <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'new' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    New Purpose
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[500px] overflow-y-auto notion-scroller">
                {activeTab === 'plan' ? (
                  <div className="space-y-3">
                    {habits.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-slate-500 text-sm italic">No legacy habits found. Create a new one first.</p>
                      </div>
                    ) : (
                      habits.map(habit => {
                        const isPlanned = !!habit.completions[tomorrow()];
                        return (
                          <button
                            key={habit.id}
                            onClick={() => !isPlanned && handlePlanExisting(habit.id)}
                            disabled={isPlanned}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isPlanned ? 'bg-slate-900 border-slate-800 opacity-50 cursor-default' : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500 group group-hover:bg-slate-800/50 cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/5" style={{ backgroundColor: `${habit.color}20`, color: habit.color }}>
                                <Check className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-white tracking-tight">{habit.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{habit.time}</p>
                              </div>
                            </div>
                            {isPlanned ? (
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-lg">Set</span>
                            ) : (
                              <Plus className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCreateNew} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Defining the Act</label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Deep Meditation"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-1 focus:ring-indigo-500 transition-all text-sm outline-none text-white placeholder-slate-700 font-bold"
                        id="habit-name-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Scheduled
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-1 focus:ring-indigo-500 transition-all text-sm outline-none text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <RotateCcw className="w-3 h-3" /> Cycle
                        </label>
                        <div className="relative">
                          <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as Frequency)}
                            className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-1 focus:ring-indigo-500 transition-all text-sm outline-none appearance-none text-white font-bold"
                          >
                            <option value="daily">Everyday</option>
                            <option value="weekly">Pattern</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {frequency === 'weekly' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pattern Nodes</label>
                        <div className="flex justify-between gap-2">
                          {DAYS.map((day, i) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(i)}
                              className={`
                                w-9 h-9 rounded text-[10px] font-bold transition-all border
                                ${daysOfWeek.includes(i) 
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                                  : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-500'}
                              `}
                            >
                              {day.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-[0.2em]"
                        id="create-habit-submit"
                      >
                        Commit Tomorrow
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
