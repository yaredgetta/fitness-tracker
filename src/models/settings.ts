export type WeightUnit = 'kg' | 'lb';

export interface Settings {
  weightUnit: WeightUnit;
}

export const DEFAULT_SETTINGS: Settings = { weightUnit: 'kg' };
