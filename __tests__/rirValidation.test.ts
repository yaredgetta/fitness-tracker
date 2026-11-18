import { makeSession, makeExercise, makeSet } from './helpers';
import { applyFailure, applyRir } from '../src/utils/rir';
import { validateSessionForFinish, validateSet } from '../src/utils/validation';

describe('RIR y fallo', () => {
  it('fallo => RIR 0', () => {
    const s = applyFailure(makeSet({ rir: 3 }), true);
    expect(s.rir).toBe(0);
    expect(s.failure).toBe(true);
  });
  it('RIR 0 => fallo', () => expect(applyRir(makeSet(), 0).failure).toBe(true));
  it('RIR > 0 quita el fallo', () => {
    const s = applyRir(makeSet({ rir: 0, failure: true }), 2);
    expect(s).toMatchObject({ rir: 2, failure: false });
  });
  it('desmarcar fallo deja RIR indefinido', () => {
    expect(applyFailure(makeSet({ rir: 0, failure: true }), false)).toMatchObject({ rir: null, failure: false });
  });
  it('limita el RIR a 0..5', () => {
    expect(applyRir(makeSet(), 9).rir).toBe(5);
    expect(applyRir(makeSet(), -3).rir).toBe(0);
  });
});

describe('validación', () => {
  it('acepta peso 0', () => expect(validateSet(makeSet({ weight: 0 }))).toEqual([]));
  it('rechaza negativos y reps 0', () => {
    expect(validateSet(makeSet({ weight: -1 }))).toContain('weight_invalid');
    expect(validateSet(makeSet({ reps: 0 }))).toContain('reps_invalid');
    expect(validateSet(makeSet({ reps: NaN }))).toContain('reps_invalid');
  });
  it('detecta RIR y fallo inconsistentes', () => {
    expect(validateSet(makeSet({ rir: 2, failure: true }))).toContain('failure_inconsistent');
    expect(validateSet(makeSet({ rir: 0, failure: false }))).toContain('failure_inconsistent');
  });
  it('RIR sin definir es válido', () => expect(validateSet(makeSet({ rir: null }))).toEqual([]));
  it('no deja finalizar sin series completadas', () => {
    const s = makeSession({ exercises: [makeExercise([makeSet({ completed: false })])] });
    expect(validateSessionForFinish(s)).toEqual({ ok: false, reason: 'no_completed_sets' });
  });
  it('permite finalizar con series válidas', () => {
    expect(validateSessionForFinish(makeSession({ exercises: [makeExercise([makeSet()])] })).ok).toBe(true);
  });
});
