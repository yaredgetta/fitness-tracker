import type { WorkoutSession } from '../models/session';
import { getKeyValueStore } from './kv';
import { KEYS } from './keys';
import { unwrap, wrap } from './envelope';
import { isWorkoutSession } from './guards';

/** Borrador de la sesión en curso (autoguardado). */
export const activeSessionRepository = {
  async load(): Promise<WorkoutSession | null> {
    return unwrap<WorkoutSession>(await getKeyValueStore().getItem(KEYS.activeSession), isWorkoutSession);
  },
  async save(session: WorkoutSession): Promise<void> {
    await getKeyValueStore().setItem(KEYS.activeSession, wrap(session));
  },
  async clear(): Promise<void> {
    await getKeyValueStore().removeItem(KEYS.activeSession);
  },
};
