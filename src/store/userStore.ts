import { create } from 'zustand';
import type { UserProfile } from '../models/user';
import { userRepository } from '../storage/userRepository';
import { uid } from '../utils/ids';

interface UserState {
  user: UserProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setName: (name: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  hydrated: false,
  async hydrate() {
    const user = await userRepository.get();
    set({ user, hydrated: true });
  },
  async setName(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = get().user;
    const user: UserProfile = current
      ? { ...current, name: trimmed }
      : { id: uid('user'), name: trimmed, createdAt: new Date().toISOString() };
    await userRepository.save(user);
    set({ user });
  },
}));
