import type { UserProfile } from '../models/user';
import { getKeyValueStore } from './kv';
import { KEYS } from './keys';
import { unwrap, wrap } from './envelope';
import { isUserProfile } from './guards';

export const userRepository = {
  async get(): Promise<UserProfile | null> {
    return unwrap<UserProfile>(await getKeyValueStore().getItem(KEYS.user), isUserProfile);
  },
  async save(user: UserProfile): Promise<void> {
    await getKeyValueStore().setItem(KEYS.user, wrap(user));
  },
  async clear(): Promise<void> {
    await getKeyValueStore().removeItem(KEYS.user);
  },
};
