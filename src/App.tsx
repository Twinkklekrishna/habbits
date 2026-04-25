import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Bell, 
  Trash2,
  Flame,
  X,
  Clock,
  Save,
  StickyNote,
  Flower2,
  Sprout
} from 'lucide-react';
import { useHabits } from './hooks/useHabits.ts';
import { useNotes } from './hooks/useNotes';
import { AddHabitModal } from './components/AddHabitModal.tsx';
import { getStartOfWeek, getWeekDays, formatISO, isToday, getDayName, getMonthName } from './lib/utils.ts';
import { Habit } from './types.ts';

const GARDEN_PLANTS = [
  { name: 'Rose', seed: '🌰', sprout: '🌱', bloom: '🌹' },
  { name: 'Lotus', seed: '🌰', sprout: '🌿', bloom: '🪷' },
  { name: 'Sunflower', seed: '🌰', sprout: '🌱', bloom: '🌻' },
  { name: 'Orchid', seed: '🌰', sprout: '🌿', bloom: '🌸' },
  { name: 'Lavender', seed: '🌰', sprout: '🌱', bloom: '💜' },
  { name: 'Tulip', seed: '🌰', sprout: '🌿', bloom: '🌷' },
  { name: 'Peony', seed: '🌰', sprout: '🌱', bloom: '🪻' },
  { name: 'Jasmine', seed: '🌰', sprout: '🌿', bloom: '🤍' },
  { name: 'Hibiscus', seed: '🌰', sprout: '🌱', bloom: '🌺' },
  { name: 'Daisy', seed: '🌰', sprout: '🌿', bloom: '🌼' },
  { name: 'Marigold', seed: '🌰', sprout: '🌱', bloom: '🧡' },
  { name: 'Lily', seed: '🌰', sprout: '🌿', bloom: '🌷' },
];

export default function App() {
  const { habits, addHabit, deleteHabit, updateCompletion, planHabitForDate, getStats } = useHabits();
  const { notes, saveNote, deleteNote, getNoteById } = useNotes();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('Untitled note');
  const [draftText, setDraftText] = useState('');
  const lastNotifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const isPlanningWindow = () => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // 11:50 PM to 11:59 PM is the window for planning tomorrow
    return hours === 23 && minutes >= 50;
  };

  const todayDate = () => formatISO(now);

  const weekDays = getWeekDays(currentWeekStart);
  const activeNote = activeNoteId ? getNoteById(activeNoteId) : null;
  const isDraftingNewNote = activeNoteId === null;

  useEffect(() => {
    if (!isNotesOpen) return;

    if (activeNote) {
      setDraftTitle(activeNote.title);
      setDraftText(activeNote.text);
    } else if (!activeNoteId) {
      setDraftTitle('Untitled note');
      setDraftText('');
    }
  }, [activeNoteId, activeNote, isNotesOpen]);

  const startNewNote = () => {
    setIsGardenOpen(false);
    setActiveNoteId(null);
    setDraftTitle('Untitled note');
    setDraftText('');
    setIsNotesOpen(true);
  };

  const openNotes = () => {
    setIsGardenOpen(false);
    setIsNotesOpen(true);
    if (activeNoteId) return;

    if (notes.length > 0) {
      setActiveNoteId(notes[0].id);
    } else {
      startNewNote();
    }
  };

  const openGarden = () => {
    setIsNotesOpen(false);
    setIsGardenOpen(true);
  };

  const perfectDaysCompleted = useMemo(() => {
    const allDates = new Set<string>();

    habits.forEach((habit) => {
      Object.keys(habit.completions).forEach((date) => allDates.add(date));
    });

    let completedDays = 0;

    allDates.forEach((date) => {
      const plannedHabits = habits.filter((habit) => !!habit.completions[date]);
      if (plannedHabits.length === 0) return;

      const allCompleted = plannedHabits.every((habit) => habit.completions[date]?.completed);
      if (allCompleted) completedDays += 1;
    });

    return completedDays;
  }, [habits]);

  const totalGardenDays = Math.min(perfectDaysCompleted, GARDEN_PLANTS.length * 30);
  const bloomedPlants = Math.min(Math.floor(totalGardenDays / 30), GARDEN_PLANTS.length);
  const activePlantIndex = Math.min(bloomedPlants, GARDEN_PLANTS.length - 1);
  const activePlantGrowthDays = totalGardenDays >= GARDEN_PLANTS.length * 30 ? 30 : totalGardenDays % 30;
  const activePlantProgress = Math.round((activePlantGrowthDays / 30) * 100);

  const getPlantStageEmoji = (index: number) => {
    const plant = GARDEN_PLANTS[index];

    if (index < bloomedPlants) return plant.bloom;
    if (index > bloomedPlants || (bloomedPlants === GARDEN_PLANTS.length && index !== GARDEN_PLANTS.length - 1)) return '🔒';

    if (activePlantGrowthDays >= 30) return plant.bloom;
    if (activePlantGrowthDays >= 20) return '🌿';
    if (activePlantGrowthDays >= 10) return plant.sprout;
    return plant.seed;
  };

  // Notification Engine
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkHabits = () => {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayISO = todayDate();

      habits.forEach(habit => {
        const comp = habit.completions[todayISO];
        // Only notify if planned, not completed, and time matches
        if (comp && !comp.completed && habit.time === currentTime) {
          const key = `${habit.id}-${todayISO}-${currentTime}`;
          
          if (!lastNotifiedRef.current[key]) {
            new Notification(`Comeback Era: ${habit.name}`, {
              body: `It's time for your habit: ${habit.name}!`,
              icon: '/favicon.ico'
            });
            lastNotifiedRef.current[key] = 'true';
          }
        }
      });
    };

    checkHabits();
  }, [habits, notificationsEnabled, now]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  const handleToggle = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const comp = habit.completions[date];
    const nextCompleted = comp ? !comp.completed : true;

    updateCompletion(habitId, date, nextCompleted, comp?.notes);
  };

  const saveNotesOnly = () => {
    const savedId = saveNote(activeNoteId, draftTitle, draftText);
    setActiveNoteId(savedId);
    setIsNotesOpen(true);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const resetToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const canPlan = isPlanningWindow();

  useEffect(() => {
    if (!canPlan && isAddModalOpen) {
      setIsAddModalOpen(false);
    }
  }, [canPlan, isAddModalOpen]);

  return (
    <div className="flex h-screen bg-orbit-bg overflow-hidden text-orbit-ink">
      {/* Sidebar - Hidden on mobile */}
      <aside className="w-64 border-r border-orbit-border bg-orbit-surface flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-orbit-accent rounded-lg flex items-center justify-center shadow-lg shadow-orbit-accent/20">
            <span className="text-white font-bold">H</span>
          </div>
          <h1 className="font-semibold text-lg tracking-tight text-orbit-ink">Comeback Era</h1>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-8">
          <div className="px-3">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Planning Mode</p>
             <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${canPlan ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Window</span>
                  {canPlan ? <span className="text-[8px] bg-emerald-500 text-white px-1.5 rounded-full font-bold uppercase tracking-tighter shadow-sm animate-pulse">Open</span> : <span className="text-[8px] bg-slate-700 text-slate-400 px-1.5 rounded-full font-bold uppercase tracking-tighter">Locked</span>}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {canPlan
                    ? "You can now plan for tomorrow. Add new habits or select from yesterday."
                    : "Planning unlocks daily from 11:50 PM to 11:59 PM."}
                </p>
                {canPlan && (
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-2 w-full bg-white text-black text-[10px] font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-widest shadow-lg"
                  >
                    Setup Tomorrow
                  </button>
                )}
                <button
                  onClick={openNotes}
                  className="mt-2 w-full bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-slate-700 transition-colors uppercase tracking-widest border border-slate-700"
                >
                  Open Notes
                </button>
             </div>
          </div>

          <div className="px-3 pt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Focus</p>
             <button 
              onClick={requestNotificationPermission}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${notificationsEnabled ? 'text-indigo-400 bg-indigo-900/10 border border-indigo-500/20' : 'text-orbit-muted hover:text-white hover:bg-slate-800/30'}`}
            >
              <Bell className="w-4 h-4" /> {notificationsEnabled ? 'Alerts Enabled' : 'Enable Notifications'}
            </button>
          </div>

          <div className="px-3 pt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Notes</p>
             <button 
              onClick={openNotes}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-orbit-muted hover:text-white hover:bg-slate-800/30 ${isNotesOpen ? 'text-indigo-400 bg-indigo-900/10 border border-indigo-500/20' : ''}`}
            >
              <StickyNote className="w-4 h-4" /> Notes
            </button>
            <button
              onClick={startNewNote}
              className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-orbit-muted hover:text-white hover:bg-slate-800/30"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
            <button
              onClick={openGarden}
              className={`mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-orbit-muted hover:text-white hover:bg-slate-800/30 ${isGardenOpen ? 'text-emerald-300 bg-emerald-900/10 border border-emerald-500/20' : ''}`}
            >
              <Flower2 className="w-4 h-4" /> Garden
            </button>
          </div>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Impact</p>
            <p className="text-2xl font-bold text-white mb-2">{habits.reduce((acc, h) => acc + Object.values(h.completions).filter((c: any) => c.completed).length, 0)} Acts</p>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
               <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: `${Math.min((habits.reduce((acc, h) => acc + Object.values(h.completions).filter((c: any) => c.completed).length, 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col h-full relative overflow-y-auto notion-scroller">
          <header className="sticky top-0 z-20 bg-orbit-bg/90 backdrop-blur-md px-4 md:px-8 py-6 md:py-10 border-b border-orbit-border flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-3xl font-bold tracking-tight text-orbit-ink">
                  Dashboard
                </h2>
                {canPlan && (
                  <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-lg animate-pulse ring-2 ring-emerald-500/20">
                    Planning Mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {getMonthName(now)} {now.getDate()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center shadow-lg">
                 <button onClick={prevWeek} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                 <button onClick={resetToToday} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">Today</button>
                 <button onClick={nextWeek} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <button
                onClick={openNotes}
                className="bg-slate-900 border border-slate-800 text-white px-3 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <StickyNote className="w-4 h-4" /> <span className="hidden sm:inline">Notes</span>
              </button>
              <button
                onClick={openGarden}
                className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-200 px-3 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Flower2 className="w-4 h-4" /> <span className="hidden sm:inline">Garden</span>
              </button>
              {canPlan && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-orbit-accent hover:bg-orbit-accent-hover text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-orbit-accent/30 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Plan Ahead
                </button>
              )}
            </div>
          </header>

          <div className="p-4 md:p-8 pb-32">
            {habits.length === 0 && !canPlan ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-orbit-card border border-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl ring-1 ring-white/5">
                  <Clock className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-orbit-ink mb-2">Registration Locked</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">
                  You can only add habits during the planning window (11:50 PM to 11:59 PM).
                </p>
                <button
                  onClick={startNewNote}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
                >
                  Create Note
                </button>
              </div>
            ) : (
              <div className="bg-orbit-card border border-orbit-border rounded-xl shadow-2xl overflow-hidden overflow-x-auto notion-scroller">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="p-5 font-bold text-[11px] text-slate-500 uppercase tracking-widest border-b border-orbit-border w-64 sticky left-0 bg-orbit-surface z-10">Planned Intent</th>
                      {weekDays.map((day) => (
                        <th key={day.toISOString()} className={`p-5 font-bold text-[11px] border-b border-orbit-border text-center uppercase tracking-widest ${isToday(day) ? 'bg-indigo-900/10 text-indigo-400' : 'text-slate-500'}`}>
                          {getDayName(day)}
                        </th>
                      ))}
                      <th className="p-5 font-bold text-[11px] text-slate-500 uppercase tracking-widest border-b border-orbit-border text-center">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orbit-border">
                    {habits.map((habit) => {
                      const stats = getStats(habit.id);
                      return (
                        <tr key={habit.id} className="group hover:bg-slate-800/20 transition-colors">
                          <td className="p-5 sticky left-0 bg-orbit-surface z-10 group-hover:bg-orbit-card transition-colors border-r border-orbit-border/50">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-lg ring-1 ring-white/5" style={{ backgroundColor: `${habit.color}20`, color: habit.color }}>
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-white text-sm tracking-tight">{habit.name}</span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{habit.time}</span>
                                  {canPlan && (
                                     <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-500 transition-all font-bold"><Trash2 className="w-3 h-3" /></button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {weekDays.map((day) => {
                              const dateStr = formatISO(day);
                              const comp = habit.completions[dateStr];
                              const isPlanned = !!comp;
                              const isScheduledForDay = habit.frequency === 'daily' || habit.daysOfWeek.includes(day.getDay());
                              const isInteractable = isPlanned || isScheduledForDay;
                              const isCompleted = comp?.completed ?? false;

                              return (
                                <td key={dateStr} className={`p-1 border-r border-orbit-border/30 last:border-r-0 ${isToday(day) ? 'bg-indigo-900/10' : ''}`}>
                                   <div className="w-full h-24 flex flex-col items-center justify-center relative group/cell gap-2">
                                     <button
                                      onClick={() => isInteractable && handleToggle(habit.id, dateStr)}
                                      disabled={!isInteractable}
                                      className={`w-10 h-10 flex flex-col items-center justify-center transition-all relative ${!isInteractable ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {isInteractable ? (isCompleted ? (<motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-8 h-8 flex flex-col items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20"><CheckCircle2 className="w-4 h-4 text-white" /></motion.div>) : (<div className="w-8 h-8 rounded-lg border-2 border-indigo-500/40 group-hover/cell:border-indigo-500 transition-all flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-indigo-500/40 group-hover/cell:bg-indigo-500" /></div>)) : (<div className="w-6 h-6 rounded-lg border border-slate-800 border-dashed opacity-40" />)}
                                    </button>
                                   </div>
                                </td>
                              );
                          })}
                          <td className="p-5 text-center">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                  <Flame className={`w-4 h-4 ${stats.streak > 0 ? 'text-orange-500' : 'text-slate-600'}`} />
                                  <span className="font-bold text-lg text-white">{stats.streak}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Days</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Notes Side Panel - Full screen on mobile, slide-out on desktop */}
        <AnimatePresence>
          {isNotesOpen && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNotesOpen(false)}
                className="fixed inset-0 z-30 bg-black/35"
                aria-label="Close notes"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 z-40 h-full w-full sm:w-[448px] bg-orbit-surface border-l border-slate-800 shadow-2xl flex flex-col"
              >
                <div className="w-full h-full flex flex-col">
                  <div className="p-4 md:p-8 border-b border-slate-800/50 bg-slate-900/30">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <StickyNote className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight italic">Notes</h3>
                      </div>
                      <button onClick={() => setIsNotesOpen(false)} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white transition-all rounded-xl"><X className="w-6 h-6" /></button>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Your notes</p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-600 shadow-lg shadow-indigo-600/20"><CheckCircle2 className="w-6 h-6 text-white" /></div>
                         <div>
                           <p className="text-sm font-bold text-white">{isDraftingNewNote ? draftTitle : (activeNote?.title || 'Untitled note')}</p>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                              {notes.length} saved note{notes.length === 1 ? '' : 's'}
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-8 flex flex-col overflow-y-auto notion-scroller">
                    <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Saved Notes</label>
                      <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto notion-scroller pr-1">
                         {notes.map((note) => (
                           <button
                              key={note.id}
                              onClick={() => setActiveNoteId(note.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeNote?.id === note.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                           >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${activeNote?.id === note.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                                 <StickyNote className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold truncate flex-1">{note.title}</span>
                              <span className="text-[9px] uppercase tracking-widest text-slate-500">{new Date(note.updatedAt).toLocaleDateString()}</span>
                           </button>
                         ))}
                         {notes.length === 0 && (
                           <p className="text-sm text-slate-500 italic px-1">No notes yet. Create one and jot something down.</p>
                         )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[300px]">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Note Content
                      </label>
                      <input
                        className="mb-4 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Untitled note"
                      />
                      <textarea 
                        autoFocus
                        className="flex-1 w-full bg-transparent text-lg text-slate-200 resize-none outline-none placeholder-slate-700 font-medium leading-relaxed notion-scroller"
                        placeholder="Write anything..."
                        value={draftText}
                        id="notes-textarea"
                        onChange={(e) => setDraftText(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-4 md:p-8 bg-slate-900/50 border-t border-slate-800/50">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={startNewNote}
                        className="flex-1 py-3 bg-slate-800 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-700 transition-all"
                      >
                        New Note
                      </button>
                      <button
                        onClick={() => {
                          if (!activeNote) return;
                          deleteNote(activeNote.id);
                          setActiveNoteId(null);
                          setDraftTitle('Untitled note');
                          setDraftText('');
                        }}
                        disabled={!activeNote}
                        className="flex-1 py-3 bg-rose-600/20 text-rose-300 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                    <button 
                      onClick={saveNotesOnly}
                      className="w-full py-5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Save className="w-4 h-4" /> Save Note
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Garden Window */}
        <AnimatePresence>
          {isGardenOpen && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGardenOpen(false)}
                className="fixed inset-0 z-30 bg-black/35"
                aria-label="Close garden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 z-40 h-full w-full sm:w-[520px] bg-orbit-surface border-l border-slate-800 shadow-2xl flex flex-col"
              >
                <div className="p-4 md:p-6 border-b border-slate-800/60 bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">12-Month Garden</h3>
                      <p className="text-xs text-slate-400 mt-1">Finish all planned tasks in a day to grow your plant by 1 day.</p>
                    </div>
                    <button onClick={() => setIsGardenOpen(false)} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white transition-all rounded-xl">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto notion-scroller p-4 md:p-6 space-y-5">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-2">Current Growth</p>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900/70 border border-slate-700 flex items-center justify-center text-3xl">
                        {getPlantStageEmoji(activePlantIndex)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold">Month {activePlantIndex + 1}: {GARDEN_PLANTS[activePlantIndex].name}</p>
                        <p className="text-xs text-slate-400">{activePlantGrowthDays}/30 growth days in this plant</p>
                        <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${activePlantProgress}%` }} />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Total: <span className="font-bold text-white">{totalGardenDays}</span> / 360 completed growth days</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Your 12 Plants</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {GARDEN_PLANTS.map((plant, index) => {
                        const isBloomed = index < bloomedPlants || totalGardenDays >= 360;
                        const isActive = index === activePlantIndex && !isBloomed;
                        const isLocked = index > activePlantIndex && totalGardenDays < 360;

                        return (
                          <div
                            key={plant.name}
                            className={`rounded-xl border p-3 transition-all ${
                              isBloomed
                                ? 'border-emerald-400/40 bg-emerald-900/10'
                                : isActive
                                  ? 'border-pink-400/40 bg-pink-900/10'
                                  : 'border-slate-700 bg-slate-900/30'
                            }`}
                          >
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Month {index + 1}</p>
                            <div className="text-3xl mb-2">{isLocked ? '🔒' : getPlantStageEmoji(index)}</div>
                            <p className="text-sm font-bold text-white">{plant.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {isBloomed ? 'Bloomed' : isActive ? 'Growing' : 'Locked'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4 text-xs text-slate-300 leading-relaxed">
                    <p className="font-bold text-white mb-1 flex items-center gap-2"><Sprout className="w-4 h-4 text-emerald-300" /> How it works</p>
                    <p>Each day you complete all planned tasks, your current plant grows by 1 day. At day 30 it blooms, then you move to the next plant. Complete all 12 plants to finish your full comeback garden.</p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addHabit}
        habits={habits}
        planHabitForDate={planHabitForDate}
        now={now}
      />
    </div>
  );
}

