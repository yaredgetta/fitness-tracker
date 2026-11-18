import { makeExercise, makeSession, makeSet, memoryStore } from './helpers';
import { setKeyValueStore } from '../src/storage/kv';
import { sessionRepository } from '../src/storage/sessionRepository';
import { userRepository } from '../src/storage/userRepository';
import { activeSessionRepository } from '../src/storage/activeSessionRepository';
import { KEYS } from '../src/storage/keys';

let kv: ReturnType<typeof memoryStore>;
beforeEach(() => { kv = memoryStore(); setKeyValueStore(kv); });
afterAll(() => setKeyValueStore(null));

describe('persistencia', () => {
  it('guarda y recupera el usuario', async () => {
    await userRepository.save({ id: 'u1', name: 'Jared', createdAt: '2026-11-10T00:00:00Z' });
    expect((await userRepository.get())?.name).toBe('Jared');
  });

  it('guarda sesiones y las devuelve de la más reciente a la más antigua', async () => {
    await sessionRepository.save(makeSession({ id: 'a', startedAt: '2026-11-01T10:00:00Z' }));
    await sessionRepository.save(makeSession({ id: 'c', startedAt: '2026-11-09T10:00:00Z' }));
    await sessionRepository.save(makeSession({ id: 'b', startedAt: '2026-11-05T10:00:00Z' }));
    expect((await sessionRepository.getAll()).map((s) => s.id)).toEqual(['c', 'b', 'a']);
    expect((await sessionRepository.listIndex()).map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });

  it('conserva el detalle completo de la sesión', async () => {
    const s = makeSession({ exercises: [makeExercise([makeSet({ rir: 0, failure: true })])] });
    await sessionRepository.save(s);
    expect(await sessionRepository.get(s.id)).toEqual(s);
  });

  it('guardar dos veces la misma sesión no duplica el índice', async () => {
    const s = makeSession();
    await sessionRepository.save(s);
    await sessionRepository.save({ ...s, durationSec: 99 });
    expect(await sessionRepository.listIndex()).toHaveLength(1);
    expect((await sessionRepository.get(s.id))?.durationSec).toBe(99);
  });

  it('elimina sesión e índice', async () => {
    await sessionRepository.save(makeSession({ id: 'x' }));
    await sessionRepository.remove('x');
    expect(await sessionRepository.get('x')).toBeNull();
    expect(await sessionRepository.listIndex()).toEqual([]);
  });

  it('ignora datos corruptos sin lanzar error', async () => {
    await sessionRepository.save(makeSession({ id: 'ok' }));
    await sessionRepository.save(makeSession({ id: 'bad', startedAt: '2026-11-11T10:00:00Z' }));
    kv.data.set(KEYS.session('bad'), '{no es json');
    expect((await sessionRepository.getAll()).map((s) => s.id)).toEqual(['ok']);
  });

  it('rechaza esquemas más nuevos que la app', async () => {
    kv.data.set(KEYS.user, JSON.stringify({ schemaVersion: 999, data: { id: 'u', name: 'X', createdAt: '' } }));
    expect(await userRepository.get()).toBeNull();
  });

  it('el borrador de sesión sobrevive y se puede limpiar', async () => {
    const draft = makeSession({ id: 'draft', status: 'active', endedAt: undefined });
    await activeSessionRepository.save(draft);
    expect((await activeSessionRepository.load())?.id).toBe('draft');
    await activeSessionRepository.clear();
    expect(await activeSessionRepository.load()).toBeNull();
  });
});
