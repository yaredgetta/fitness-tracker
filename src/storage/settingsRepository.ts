import { DEFAULT_SETTINGS, type Settings } from '../models/settings';
import { getKeyValueStore } from './kv';
import { KEYS } from './keys';
import { unwrap, wrap } from './envelope';
import { isSettings } from './guards';

export const settingsRepository = {
  async get(): Promise<Settings> {
    return unwrap<Settings>(await getKeyValueStore().getItem(KEYS.settings), isSettings) ?? DEFAULT_SETTINGS;
  },
  async save(settings: Settings): Promise<void> {
    await getKeyValueStore().setItem(KEYS.settings, wrap(settings));
  },
};
