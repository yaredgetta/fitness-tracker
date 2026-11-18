import { makeExercise, makeSession, makeSet } from './helpers';
import { completedSetCount, exerciseVolume, maxWeight, sessionVolume, setVolume } from '../src/utils/volume';

describe('volumen', () => {
  it('serie = peso × reps', () => expect(setVolume({ weight: 60, reps: 12 })).toBe(720));

  it('ejercicio suma solo series completadas', () => {
    const ex = makeExercise([
      makeSet({ weight: 60, reps: 12 }),
      makeSet({ weight: 60, reps: 10 }),
      makeSet({ weight: 100, reps: 5, completed: false }),
    ]);
    expect(exerciseVolume(ex)).toBe(720 + 600);
    expect(maxWeight(ex)).toBe(60);
  });

  it('sesión suma ejercicios y cuenta series completadas', () => {
    const s = makeSession({
      exercises: [
        makeExercise([makeSet({ weight: 50, reps: 10 })]),
        makeExercise([makeSet({ weight: 20, reps: 10 }), makeSet({ completed: false })]),
      ],
    });
    expect(sessionVolume(s)).toBe(500 + 200);
    expect(completedSetCount(s)).toBe(2);
  });

  it('peso corporal (0 kg) da volumen 0 sin romperse', () => {
    expect(exerciseVolume(makeExercise([makeSet({ weight: 0, reps: 15 })]))).toBe(0);
  });
});
