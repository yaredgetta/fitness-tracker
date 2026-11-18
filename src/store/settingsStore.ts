import { create } from 'zustand';
import { DEFAULT_SETTINGS, type WeightUnit } from '../models/settings';
import { settingsRepository } from '../storage/settingsRepository';

interface SettingsState {
  weightUnit: WeightUnit;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  weightUnit: DEFAULT_SETTINGS.weightUnit,
  hydrated: false,
  async hydrate() {
    const s = await settingsRepository.get();
    set({ weightUnit: s.weightUnit, hydrated: true });
  },
  async setWeightUnit(unit) {
    set({ weightUnit: unit });
    await settingsRepository.save({ weightUnit: unit });
  },
}));
