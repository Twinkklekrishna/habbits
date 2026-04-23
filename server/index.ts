import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import type { Habit, HabitCompletion } from '../src/types.ts';

loadEnv();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'habits.json');

app.use(express.json());

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]\n', 'utf8');
  }
}

async function readHabits(): Promise<Habit[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as Habit[];
}

async function writeHabits(habits: Habit[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(habits, null, 2) + '\n', 'utf8');
}

function streakFromHabit(habit: Habit) {
  const dates = Object.keys(habit.completions).sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const date of dates) {
    const completion = habit.completions[date];
    if (!completion.completed) continue;

    const completionDate = new Date(date);
    const diff = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === streak || diff === streak + 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function validateHabitPayload(body: Partial<Habit>) {
  const requiredFields: Array<keyof Pick<Habit, 'name' | 'color' | 'icon' | 'time' | 'frequency' | 'daysOfWeek'>> = [
    'name',
    'color',
    'icon',
    'time',
    'frequency',
    'daysOfWeek',
  ];

  return requiredFields.every((field) => body[field] !== undefined);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'comeback-era-backend' });
});

app.get('/api/habits', async (_req, res) => {
  const habits = await readHabits();
  res.json(habits);
});

app.post('/api/habits', async (req, res) => {
  if (!validateHabitPayload(req.body)) {
    return res.status(400).json({ error: 'Missing required habit fields.' });
  }

  const habits = await readHabits();
  const nextHabit: Habit = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    completions: {},
    ...req.body,
  } as Habit;

  habits.push(nextHabit);
  await writeHabits(habits);
  res.status(201).json(nextHabit);
});

app.put('/api/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const index = habits.findIndex((habit) => habit.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  habits[index] = {
    ...habits[index],
    ...req.body,
    id: habits[index].id,
    createdAt: habits[index].createdAt,
    completions: req.body.completions ?? habits[index].completions,
  } as Habit;

  await writeHabits(habits);
  res.json(habits[index]);
});

app.delete('/api/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const filtered = habits.filter((habit) => habit.id !== req.params.id);

  if (filtered.length === habits.length) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  await writeHabits(filtered);
  res.status(204).send();
});

app.post('/api/habits/:id/plan', async (req, res) => {
  const { date } = req.body as { date?: string };
  if (!date) {
    return res.status(400).json({ error: 'A planning date is required.' });
  }

  const habits = await readHabits();
  const habit = habits.find((item) => item.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  habit.completions[date] = habit.completions[date] ?? {
    date,
    completed: false,
    plannedAt: Date.now(),
  };

  await writeHabits(habits);
  res.json(habit);
});

app.patch('/api/habits/:id/completions/:date', async (req, res) => {
  const habits = await readHabits();
  const habit = habits.find((item) => item.id === req.params.id);

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  const { completed, notes } = req.body as { completed?: boolean; notes?: string };
  const date = req.params.date;
  const existing: HabitCompletion = habit.completions[date] ?? {
    date,
    completed: false,
    plannedAt: Date.now(),
  };

  habit.completions[date] = {
    ...existing,
    completed: completed ?? existing.completed,
    notes: notes ?? existing.notes,
  };

  await writeHabits(habits);
  res.json(habit.completions[date]);
});

app.get('/api/stats/:id', async (req, res) => {
  const habits = await readHabits();
  const habit = habits.find((item) => item.id === req.params.id);

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  res.json({
    streak: streakFromHabit(habit),
    total: Object.values(habit.completions).filter((completion) => completion.completed).length,
  });
});

app.listen(PORT, () => {
  console.log(`Comeback Era backend running on http://localhost:${PORT}`);
});
