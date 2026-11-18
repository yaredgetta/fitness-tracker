import type { SetEntry } from '../models/session';

export const MAX_RIR = 5;

/** Cambia el RIR manteniendo la consistencia con el indicador de fallo. */
export function applyRir(set: SetEntry, rir: number | null): SetEntry {
  if (rir === null) return { ...set, rir: null, failure: false };
  const clamped = Math.max(0, Math.min(MAX_RIR, Math.round(rir)));
  return { ...set, rir: clamped, failure: clamped === 0 };
}

/** Marca o desmarca el fallo. Fallo => RIR 0. Quitar el fallo deja el RIR sin definir. */
export function applyFailure(set: SetEntry, failure: boolean): SetEntry {
  if (failure) return { ...set, failure: true, rir: 0 };
  return { ...set, failure: false, rir: set.rir === 0 ? null : set.rir };
}
