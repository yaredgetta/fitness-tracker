import { MUSCLE_WEIGHT } from '../constants/muscleMap';
import { MUSCLE_GROUPS, type MuscleGroup } from '../models/muscle';
import type { WorkoutSession } from '../models/session';
import { setVolume } from '../utils/volume';

export type Period = '7d' | '30d' | 'all';
/** 0 = sin entrenamiento, 1 = bajo, 2 = medio, 3 = alto. */
export type IntensityLevel = 0 | 1 | 2 | 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function periodStart(period: Period, now: Date): number {
  if (period === 'all') return -Infinity;
  return now.getTime() - (period === '7d' ? 7 : 30) * DAY_MS;
}

export interface MuscleExerciseStat {
  exerciseId: string;
  name: string;
  role: 'primary' | 'secondary';
  sets: number;
  volume: number;
}

export interface MuscleStat {
  muscle: MuscleGroup;
  /** Volumen ponderado: músculo principal ×1, secundarios ×0.5. */
  volume: number;
  /** Series completadas en las que el músculo participó (principal o secundario). */
  sets: number;
  /** Series en las que fue el músculo principal. */
  primarySets: number;
  /** ISO de la última sesión en que se trabajó, o null. */
  lastDate: string | null;
  exercises: MuscleExerciseStat[];
}

export type MuscleStats = Record<MuscleGroup, MuscleStat>;

export function computeMuscleStats(
  sessions: WorkoutSession[],
  period: Period,
  now: Date = new Date(),
): MuscleStats {
  const stats = Object.fromEntries(
    MUSCLE_GROUPS.map((m) => [m, { muscle: m, volume: 0, sets: 0, primarySets: 0, lastDate: null, exercises: [] } as MuscleStat]),
  ) as MuscleStats;
  const since = periodStart(period, now);

  for (const session of sessions) {
    if (session.status !== 'finished') continue;
    if (new Date(session.startedAt).getTime() < since) continue;

    for (const ex of session.exercises) {
      const sets = ex.sets.filter((s) => s.completed);
      if (sets.length === 0) continue;
      const rawVolume = sets.reduce((n, s) => n + setVolume(s), 0);

      const involved: [MuscleGroup, 'primary' | 'secondary'][] = [
        [ex.primaryMuscle, 'primary'],
        ...ex.secondaryMuscles.filter((m) => m !== ex.primaryMuscle).map((m) => [m, 'secondary'] as [MuscleGroup, 'secondary']),
      ];

      for (const [muscle, role] of involved) {
        const stat = stats[muscle];
        const weight = MUSCLE_WEIGHT[role];
        stat.volume += rawVolume * weight;
        stat.sets += sets.length;
        if (role === 'primary') stat.primarySets += sets.length;
        if (!stat.lastDate || session.startedAt > stat.lastDate) stat.lastDate = session.startedAt;

        const entry = stat.exercises.find((e) => e.exerciseId === ex.exerciseId && e.role === role);
        if (entry) {
          entry.sets += sets.length;
          entry.volume += rawVolume * weight;
        } else {
          stat.exercises.push({ exerciseId: ex.exerciseId, name: ex.name, role, sets: sets.length, volume: rawVolume * weight });
        }
      }
    }
  }

  for (const stat of Object.values(stats)) stat.exercises.sort((a, b) => b.volume - a.volume || b.sets - a.sets);
  return stats;
}

/**
 * Intensidad relativa al músculo más trabajado del periodo.
 * Un músculo con series pero volumen 0 (peso corporal) nunca queda en gris: mínimo nivel 1.
 */
export function intensityLevels(stats: MuscleStats): Record<MuscleGroup, IntensityLevel> {
  const maxVolume = Math.max(...Object.values(stats).map((s) => s.volume));
  const levels = {} as Record<MuscleGroup, IntensityLevel>;
  for (const stat of Object.values(stats)) {
    if (stat.sets === 0) levels[stat.muscle] = 0;
    else if (maxVolume <= 0) levels[stat.muscle] = 1;
    else {
      const ratio = stat.volume / maxVolume;
      levels[stat.muscle] = ratio < 1 / 3 ? 1 : ratio < 2 / 3 ? 2 : 3;
    }
  }
  return levels;
}
