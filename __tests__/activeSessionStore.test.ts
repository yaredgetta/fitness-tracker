import { makeSession, memoryStore } from './helpers';
import { setKeyValueStore } from '../src/storage/kv';
import { activeSessionRepository } from '../src/storage/activeSessionRepository';
import { sessionRepository } from '../src/storage/sessionRepository';
import { useActiveSessionStore } from '../src/store/activeSessionStore';
import { useHistoryStore } from '../src/store/historyStore';
import { addExercise, toggleSetCompleted, updateSetValues } from '../src/services/sessionService';
import { createCatalog } from '../src/services/exerciseCatalog';
import fs from 'fs';
import path from 'path';

const catalog = createCatalog(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/exercises.json'), 'utf8')),
);
const bench = catalog.getById('pectorals/barbell-bench-press')!;
const store = () => useActiveSessionStore.getState();

beforeEach(() => {
  setKeyValueStore(memoryStore());
  useActiveSessionStore.setState({ session: null, hydrated: false });
  useHistoryStore.setState({ sessions: [], hydrated: false });
});
afterAll(() => setKeyValueStore(null));

async function fillOneSet() {
  await store().start();
  store().update((s) => addExercise(s, bench));
  const id = store().session!.exercises[0].sets[0].id;
  store().update((s) => updateSetValues(s, 0, id, { weight: 60, reps: 10 }));
  store().update((s) => toggleSetCompleted(s, 0, id));
}

describe('sesión activa', () => {
  it('el autoguardado sobrevive a "cerrar la app" (nuevo hydrate)', async () => {
    await fillOneSet();
    await store().flush();
    useActiveSessionStore.setState({ session: null, hydrated: false }); // simula reinicio
    await store().hydrate();
    const s = store().session!;
    expect(s.exercises[0].sets[0]).toMatchObject({ weight: 60, reps: 10, completed: true });
  });

  it('start no reemplaza una sesión en curso', async () => {
    await store().start();
    const id = store().session!.id;
    await store().start();
    expect(store().session!.id).toBe(id);
  });

  it('finalizar guarda en el historial y limpia el borrador', async () => {
    await fillOneSet();
    expect(await store().finish()).toBe(true);
    expect(store().session).toBeNull();
    expect(await activeSessionRepository.load()).toBeNull();
    expect(await sessionRepository.getAll()).toHaveLength(1);
    expect(useHistoryStore.getState().sessions).toHaveLength(1);
  });

  it('no finaliza sin series completadas', async () => {
    await store().start();
    store().update((s) => addExercise(s, bench));
    expect(await store().finish()).toBe(false);
    expect(store().session).not.toBeNull();
  });

  it('descartar elimina el borrador', async () => {
    await fillOneSet();
    await store().flush();
    await store().discard();
    expect(store().session).toBeNull();
    expect(await activeSessionRepository.load()).toBeNull();
  });

  it('no reabre un borrador cuya sesión ya está en el historial', async () => {
    const s = makeSession({ id: 'dup', status: 'active' });
    await activeSessionRepository.save(s);
    await sessionRepository.save({ ...s, status: 'finished' });
    await store().hydrate();
    expect(store().session).toBeNull();
    expect(await activeSessionRepository.load()).toBeNull();
  });
});
