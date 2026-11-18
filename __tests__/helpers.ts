import type { SetEntry, SessionExercise, WorkoutSession } from '../src/models/session';
import type { KeyValueStore } from '../src/storage/kv';

export const makeSet = (o: Partial<SetEntry> = {}): SetEntry => ({
  id: 's', setNumber: 1, weight: 60, reps: 10, rir: 2, failure: false, completed: true, ...o,
});

export const makeExercise = (sets: SetEntry[], o: Partial<SessionExercise> = {}): SessionExercise => ({
  exerciseId: 'pectorals/barbell-bench-press',
  name: 'Press de banca',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  sets,
  ...o,
});

export const makeSession = (o: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session_1',
  startedAt: '2026-11-10T10:00:00.000Z',
  endedAt: '2026-11-10T11:00:00.000Z',
  durationSec: 3600,
  status: 'finished',
  exercises: [],
  ...o,
});

export function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => { data.set(k, v); },
    removeItem: async (k) => { data.delete(k); },
    getAllKeys: async () => [...data.keys()],
  };
}
