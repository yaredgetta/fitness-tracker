import { create } from 'zustand';
import type { WorkoutSession } from '../models/session';
import { activeSessionRepository } from '../storage/activeSessionRepository';
import { sessionRepository } from '../storage/sessionRepository';
import { createAutosaver } from '../storage/autosave';
import { createSession, finishSession } from '../services/sessionService';
import { validateSessionForFinish } from '../utils/validation';
import { useHistoryStore } from './historyStore';

const autosaver = createAutosaver<WorkoutSession>((s) => activeSessionRepository.save(s), 500);

interface ActiveSessionState {
  /** Sesión en curso (o null si no hay). */
  session: WorkoutSession | null;
  hydrated: boolean;
  /** Recupera el borrador guardado al abrir la app. */
  hydrate: () => Promise<void>;
  /** Inicia una sesión nueva; si ya hay una en curso, la conserva. */
  start: () => Promise<void>;
  /** Aplica un cambio a la sesión y programa el autoguardado. */
  update: (fn: (s: WorkoutSession) => WorkoutSession) => void;
  /** Escribe de inmediato lo pendiente (al pasar la app a segundo plano). */
  flush: () => Promise<void>;
  /** Finaliza y guarda en el historial. Devuelve false si no hay series válidas. */
  finish: () => Promise<boolean>;
  discard: () => Promise<void>;
}

export const useActiveSessionStore = create<ActiveSessionState>((set, get) => ({
  session: null,
  hydrated: false,

  async hydrate() {
    let draft = await activeSessionRepository.load();
    // Si la app se cerró justo entre guardar el historial y borrar el borrador, no lo reabras.
    if (draft && (await sessionRepository.get(draft.id))) {
      await activeSessionRepository.clear();
      draft = null;
    }
    set({ session: draft, hydrated: true });
  },

  async start() {
    if (get().session) return;
    const session = createSession();
    set({ session });
    await activeSessionRepository.save(session);
  },

  update(fn) {
    const current = get().session;
    if (!current) return;
    const next = fn(current);
    set({ session: next });
    autosaver.schedule(next);
  },

  flush: () => autosaver.flush(),

  async finish() {
    const current = get().session;
    if (!current || !validateSessionForFinish(current).ok) return false;
    autosaver.cancel();
    await useHistoryStore.getState().addSession(finishSession(current));
    await activeSessionRepository.clear();
    set({ session: null });
    return true;
  },

  async discard() {
    autosaver.cancel();
    await activeSessionRepository.clear();
    set({ session: null });
  },
}));
