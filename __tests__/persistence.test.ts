import { makeExercise, makeSession, makeSet, memoryStore } from './helpers';
import { setKeyValueStore } from '../src/storage/kv';
import { KEYS } from '../src/storage/keys';
import { wrap } from '../src/storage/envelope';
import { sessionRepository } from '../src/storage/sessionRepository';
import { activeSessionRepository } from '../src/storage/activeSessionRepository';
import { userRepository } from '../src/storage/userRepository';
import { isWorkoutSession } from '../src/storage/guards';
import { addExercise, createSession, finishSession, toggleSetCompleted, updateSetValues } from '../src/services/sessionService';
import { createCatalog } from '../src/services/exerciseCatalog';
import fs from 'fs';
import path from 'path';

let kv: ReturnType<typeof memoryStore>;
beforeEach(() => { kv = memoryStore(); setKeyValueStore(kv); });
afterAll(() => setKeyValueStore(null));

const full = () => makeSession({ exercises: [makeExercise([makeSet()])] });

describe('datos dañados o incompletos', () => {
  it('un JSON válido pero incompleto no se acepta como sesión', async () => {
    kv.data.set(KEYS.session('a'), wrap({ id: 'a', startedAt: '2026-11-01T10:00:00Z' })); // faltan campos
    expect(await sessionRepository.get('a')).toBeNull();
    expect(await sessionRepository.getAll()).toEqual([]);
  });

  it('rechaza ejercicios con músculo desconocido o series mal formadas', () => {
    const base = full();
    expect(isWorkoutSession(base)).toBe(true);
    expect(isWorkoutSession({ ...base, exercises: [{ ...base.exercises[0], primaryMuscle: 'cuello' }] })).toBe(false);
    expect(isWorkoutSession({ ...base, exercises: [{ ...base.exercises[0], sets: [{ weight: 'x' }] }] })).toBe(false);
    expect(isWorkoutSession({ ...base, startedAt: 'no-es-fecha' })).toBe(false);
    expect(isWorkoutSession(null)).toBe(false);
  });

  it('un borrador dañado se ignora sin lanzar error', async () => {
    kv.data.set(KEYS.activeSession, wrap({ id: 'x', exercises: 'roto' }));
    expect(await activeSessionRepository.load()).toBeNull();
  });

  it('un usuario dañado se ignora', async () => {
    kv.data.set(KEYS.user, wrap({ name: 42 }));
    expect(await userRepository.get()).toBeNull();
  });

  it('el guard NO rechaza sesiones reales generadas por la app', () => {
    const catalog = createCatalog(
      JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')),
    );
    // Recorre todos los ejercicios registrables: ninguno debe producir una sesión "inválida".
    const trackable = catalog.search({ limit: 5000 });
    expect(trackable.length).toBeGreaterThan(500);
    for (const ex of trackable) {
      let s = addExercise(createSession(), ex);
      const id = s.exercises[0].sets[0].id;
      s = toggleSetCompleted(updateSetValues(s, 0, id, { weight: 0, reps: 8 }), 0, id);
      expect(isWorkoutSession(finishSession(s))).toBe(true);
      expect(isWorkoutSession(s)).toBe(true); // borrador
    }
  });
});

describe('recuperación del índice', () => {
  it('una sesión guardada sin índice (cierre a medias) sigue apareciendo', async () => {
    await sessionRepository.save(makeSession({ id: 'a', startedAt: '2026-11-01T10:00:00Z' }));
    // simula: se escribió la sesión, la app se cerró antes de actualizar el índice
    kv.data.set(KEYS.session('b'), wrap(makeSession({ id: 'b', startedAt: '2026-11-05T10:00:00Z' })));
    expect((await sessionRepository.getAll()).map((s) => s.id)).toEqual(['b', 'a']);
    expect((await sessionRepository.listIndex()).map((s) => s.id)).toEqual(['b', 'a']); // índice reparado
  });

  it('un índice dañado no esconde las sesiones', async () => {
    await sessionRepository.save(makeSession({ id: 'a' }));
    kv.data.set(KEYS.sessionIndex, '{{{ roto');
    expect((await sessionRepository.getAll()).map((s) => s.id)).toEqual(['a']);
    expect(await sessionRepository.listIndex()).toHaveLength(1);
  });

  it('un índice borrado se reconstruye', async () => {
    await sessionRepository.save(makeSession({ id: 'a' }));
    kv.data.delete(KEYS.sessionIndex);
    expect(await sessionRepository.getAll()).toHaveLength(1);
    expect(await sessionRepository.listIndex()).toHaveLength(1);
  });

  it('entradas de índice sin sesión se limpian', async () => {
    await sessionRepository.save(makeSession({ id: 'a' }));
    kv.data.delete(KEYS.session('a'));
    expect(await sessionRepository.getAll()).toEqual([]);
    expect(await sessionRepository.listIndex()).toEqual([]);
  });

  it('instalación nueva: sin datos no falla', async () => {
    expect(await sessionRepository.getAll()).toEqual([]);
    expect(await userRepository.get()).toBeNull();
    expect(await activeSessionRepository.load()).toBeNull();
  });

  it('no confunde la clave del índice con una sesión', async () => {
    await sessionRepository.save(makeSession({ id: 'a' }));
    expect(await sessionRepository.getAll()).toHaveLength(1); // @ft/sessionIndex no empieza con @ft/session/
  });
});
