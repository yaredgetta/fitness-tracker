import type { WorkoutSession } from '../models/session';
import { getKeyValueStore } from './kv';
import { KEYS } from './keys';
import { unwrap, wrap } from './envelope';
import { isSessionIndex, isWorkoutSession } from './guards';

export interface SessionIndexEntry {
  id: string;
  startedAt: string;
}

async function readIndex(): Promise<SessionIndexEntry[]> {
  return unwrap<SessionIndexEntry[]>(await getKeyValueStore().getItem(KEYS.sessionIndex), isSessionIndex) ?? [];
}

async function writeIndex(entries: SessionIndexEntry[]): Promise<void> {
  await getKeyValueStore().setItem(KEYS.sessionIndex, wrap(entries));
}

const byStartedAtDesc = (a: SessionIndexEntry, b: SessionIndexEntry) =>
  b.startedAt.localeCompare(a.startedAt);

export const sessionRepository = {
  /** Guarda (o reemplaza) una sesión terminada y actualiza el índice. */
  async save(session: WorkoutSession): Promise<void> {
    const kv = getKeyValueStore();
    await kv.setItem(KEYS.session(session.id), wrap(session));
    const index = (await readIndex()).filter((e) => e.id !== session.id);
    index.push({ id: session.id, startedAt: session.startedAt });
    await writeIndex(index.sort(byStartedAtDesc));
  },

  async get(id: string): Promise<WorkoutSession | null> {
    return unwrap<WorkoutSession>(await getKeyValueStore().getItem(KEYS.session(id)), isWorkoutSession);
  },

  /** Índice ordenado de la más reciente a la más antigua. */
  async listIndex(): Promise<SessionIndexEntry[]> {
    return (await readIndex()).sort(byStartedAtDesc);
  },

  /**
   * Todas las sesiones, de la más reciente a la más antigua.
   * La fuente de verdad son las propias sesiones guardadas, no el índice: así una sesión
   * no se pierde si la app se cerró antes de actualizar el índice, o si este se dañó.
   * Omite registros corruptos y repara el índice si no coincide.
   */
  async getAll(): Promise<WorkoutSession[]> {
    const keys = (await getKeyValueStore().getAllKeys()).filter((k) => k.startsWith(KEYS.sessionPrefix));
    const loaded = await Promise.all(keys.map((k) => this.get(k.slice(KEYS.sessionPrefix.length))));
    const sessions = loaded
      .filter((s): s is WorkoutSession => s !== null)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    const derived = sessions.map(({ id, startedAt }) => ({ id, startedAt }));
    if (JSON.stringify(await readIndex()) !== JSON.stringify(derived)) await writeIndex(derived);
    return sessions;
  },

  async remove(id: string): Promise<void> {
    const kv = getKeyValueStore();
    await kv.removeItem(KEYS.session(id));
    await writeIndex((await readIndex()).filter((e) => e.id !== id));
  },
};
