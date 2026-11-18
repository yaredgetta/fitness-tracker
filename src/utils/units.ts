import type { WeightUnit } from '../models/settings';

/** Todo el peso se guarda en kg. Las libras solo existen al mostrar y al teclear. */
export const KG_PER_LB = 0.45359237;

export const kgToUnit = (kg: number, unit: WeightUnit): number => (unit === 'kg' ? kg : kg / KG_PER_LB);

/** Convierte lo tecleado a kg. Se redondea a 4 decimales para que 135 lb vuelva a mostrarse como 135. */
export const unitToKg = (value: number, unit: WeightUnit): number =>
  Math.round((unit === 'kg' ? value : value * KG_PER_LB) * 10000) / 10000;

/** Hasta 2 decimales, sin ceros sobrantes ("62.5", "135"). */
export function formatNumber(n: number, maxDecimals = 2): string {
  return String(Number(n.toFixed(maxDecimals)));
}

export const formatWeight = (kg: number, unit: WeightUnit): string =>
  `${formatNumber(kgToUnit(kg, unit))} ${unit}`;

const sign = (n: number) => (n > 0 ? '+' : '');

export const formatSignedWeight = (kgDelta: number, unit: WeightUnit): string => {
  const v = Number(kgToUnit(kgDelta, unit).toFixed(2));
  return `${sign(v)}${formatNumber(v)} ${unit}`;
};

const thousands = (n: number) => Math.round(n).toLocaleString('es-MX');

export const formatVolume = (kg: number, unit: WeightUnit): string =>
  `${thousands(kgToUnit(kg, unit))} ${unit}`;

export const formatSignedVolume = (kgDelta: number, unit: WeightUnit): string => {
  const v = Math.round(kgToUnit(kgDelta, unit));
  return `${sign(v)}${v.toLocaleString('es-MX')} ${unit}`;
};
