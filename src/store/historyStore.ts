import { create } from 'zustand';
import type { WorkoutSession } from '../models/session';
import { sessionRepository } from '../storage/sessionRepository';

interface HistoryState {
  /** Sesiones terminadas, de la más reciente a la más antigua. */
  sessions: WorkoutSession[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addSession: (session: WorkoutSession) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  hydrated: false,
  async hydrate() {
    set({ sessions: await sessionRepository.getAll(), hydrated: true });
  },
  async addSession(session) {
    await sessionRepository.save(session);
    const rest = get().sessions.filter((s) => s.id !== session.id);
    set({ sessions: [session, ...rest].sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
  },
  async removeSession(id) {
    await sessionRepository.remove(id);
    set({ sessions: get().sessions.filter((s) => s.id !== id) });
  },
}));
