import type { MuscleGroup } from '../models/muscle';
import type { WorkoutSession } from '../models/session';
import { completedSetCount, sessionVolume } from '../utils/volume';

export interface DayGroup {
  /** "2026-11-10" en hora local. */
  dayKey: string;
  /** Inicio de la primera sesión del día (para mostrar la fecha). */
  date: string;
  /** Sesiones del día, la más reciente primero. */
  sessions: WorkoutSession[];
  volume: number;
  sets: number;
  muscles: MuscleGroup[];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Día calendario en la zona horaria del teléfono. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Agrupa las sesiones terminadas por día, del más reciente al más antiguo. */
export function groupSessionsByDay(sessions: WorkoutSession[]): DayGroup[] {
  const byDay = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    if (s.status !== 'finished') continue;
    const k = dayKey(s.startedAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  return [...byDay.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return {
        dayKey: key,
        date: sorted[0].startedAt,
        sessions: sorted,
        volume: sorted.reduce((n, s) => n + sessionVolume(s), 0),
        sets: sorted.reduce((n, s) => n + completedSetCount(s), 0),
        muscles: Array.from(new Set(sorted.flatMap((s) => s.exercises.map((e) => e.primaryMuscle)))),
      };
    })
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}
