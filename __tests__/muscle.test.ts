import { makeExercise, makeSession, makeSet } from './helpers';
import { BODY_BACK, BODY_BASE, BODY_FRONT, BODY_VIEWBOX } from '../src/constants/bodyPaths';
import { MUSCLE_GROUPS } from '../src/models/muscle';
import { computeMuscleStats, intensityLevels, periodStart } from '../src/services/muscleService';
import { mirrorPath } from '../src/utils/svgPath';

const NOW = new Date('2026-11-12T12:00:00Z');
const bench = (sets = [makeSet({ weight: 60, reps: 10 })], o = {}) => makeExercise(sets, o); // pecho; sec: tríceps, hombros
const day = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe('volumen por músculo', () => {
  it('principal cuenta ×1 y secundarios ×0.5', () => {
    const s = computeMuscleStats([makeSession({ startedAt: day(1), exercises: [bench()] })], '7d', NOW);
    expect(s.chest.volume).toBe(600);
    expect(s.triceps.volume).toBe(300);
    expect(s.shoulders.volume).toBe(300);
    expect(s.biceps.volume).toBe(0);
    expect(s.chest.primarySets).toBe(1);
    expect(s.triceps.primarySets).toBe(0);
    expect(s.triceps.sets).toBe(1);
  });

  it('filtra por periodo', () => {
    const sessions = [
      makeSession({ id: 'a', startedAt: day(2), exercises: [bench()] }),
      makeSession({ id: 'b', startedAt: day(20), exercises: [bench()] }),
      makeSession({ id: 'c', startedAt: day(100), exercises: [bench()] }),
    ];
    expect(computeMuscleStats(sessions, '7d', NOW).chest.volume).toBe(600);
    expect(computeMuscleStats(sessions, '30d', NOW).chest.volume).toBe(1200);
    expect(computeMuscleStats(sessions, 'all', NOW).chest.volume).toBe(1800);
  });

  it('el límite del periodo es exactamente N días', () => {
    expect(periodStart('7d', NOW)).toBe(NOW.getTime() - 7 * 86400000);
    expect(periodStart('all', NOW)).toBe(-Infinity);
  });

  it('ignora series incompletas y sesiones activas', () => {
    const sessions = [
      makeSession({ id: 'a', startedAt: day(1), exercises: [bench([makeSet({ completed: false })])] }),
      makeSession({ id: 'b', startedAt: day(1), status: 'active', exercises: [bench()] }),
    ];
    const s = computeMuscleStats(sessions, 'all', NOW);
    expect(s.chest.sets).toBe(0);
    expect(s.chest.lastDate).toBeNull();
  });

  it('guarda la última fecha y agrupa ejercicios', () => {
    const sessions = [
      makeSession({ id: 'a', startedAt: day(5), exercises: [bench()] }),
      makeSession({ id: 'b', startedAt: day(1), exercises: [bench()] }),
    ];
    const s = computeMuscleStats(sessions, 'all', NOW);
    expect(s.chest.lastDate).toBe(day(1));
    expect(s.chest.exercises).toHaveLength(1);
    expect(s.chest.exercises[0]).toMatchObject({ sets: 2, volume: 1200, role: 'primary' });
  });

  it('distingue el rol del ejercicio en cada músculo', () => {
    const s = computeMuscleStats([makeSession({ startedAt: day(1), exercises: [bench()] })], 'all', NOW);
    expect(s.triceps.exercises[0].role).toBe('secondary');
  });
});

describe('intensidad', () => {
  it('sin entrenar = 0; el más trabajado = 3', () => {
    const s = computeMuscleStats([makeSession({ startedAt: day(1), exercises: [bench()] })], '7d', NOW);
    const l = intensityLevels(s);
    expect(l.biceps).toBe(0);
    expect(l.chest).toBe(3);
    expect(l.triceps).toBe(2); // 300/600 = 0.5
  });

  it('peso corporal (volumen 0) no queda en gris', () => {
    const pullup = makeExercise([makeSet({ weight: 0, reps: 10 })], { primaryMuscle: 'back', secondaryMuscles: ['biceps'] });
    const l = intensityLevels(computeMuscleStats([makeSession({ startedAt: day(1), exercises: [pullup] })], '7d', NOW));
    expect(l.back).toBe(1);
    expect(l.biceps).toBe(1);
    expect(l.chest).toBe(0);
  });

  it('sin datos todo es 0', () => {
    expect(Object.values(intensityLevels(computeMuscleStats([], 'all', NOW))).every((v) => v === 0)).toBe(true);
  });
});

describe('geometría del cuerpo', () => {
  it('los 11 grupos tienen forma en al menos una vista', () => {
    const drawn = new Set([...Object.keys(BODY_FRONT), ...Object.keys(BODY_BACK)]);
    expect(MUSCLE_GROUPS.filter((m) => !drawn.has(m))).toEqual([]);
  });

  it('todas las coordenadas caen dentro del lienzo, también reflejadas', () => {
    const all = [...BODY_BASE, ...Object.values(BODY_FRONT).flat(), ...Object.values(BODY_BACK).flat()] as string[];
    for (const d of all) {
      for (const path of [d, mirrorPath(d)]) {
        const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number);
        nums.forEach((n, i) => {
          const max = i % 2 === 0 ? BODY_VIEWBOX.width : BODY_VIEWBOX.height;
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(max);
        });
      }
    }
  });

  it('mirrorPath refleja x respecto a 200 y conserva los comandos', () => {
    expect(mirrorPath('M120 10 L150 20 Z')).toBe('M80 10L50 20Z');
    expect(mirrorPath('M120 10 C130 20 140 30 150 40 Z')).toBe('M80 10C70 20 60 30 50 40Z');
  });

  it('el reflejo es una involución', () => {
    const d = BODY_FRONT.chest![0];
    const norm = (p: string) => p.replace(/\s*([MLCQZ])\s*/g, '$1').replace(/\s+/g, ' ');
    expect(mirrorPath(mirrorPath(d))).toBe(norm(d));
  });
});
