import { formatNumber, formatSignedVolume, formatSignedWeight, formatVolume, formatWeight, kgToUnit, unitToKg } from '../src/utils/units';

describe('unidades', () => {
  it('kg no cambia', () => {
    expect(kgToUnit(60, 'kg')).toBe(60);
    expect(unitToKg(62.5, 'kg')).toBe(62.5);
  });

  it('convierte libras a kg y de vuelta sin deriva', () => {
    for (const lb of [45, 95, 135, 185, 225, 315, 137.5, 138.75, 2.5, 5]) {
      expect(formatNumber(kgToUnit(unitToKg(lb, 'lb'), 'lb'))).toBe(String(lb));
    }
  });

  it('dos series con las mismas libras guardan el mismo peso (la comparación dice "igual")', () => {
    expect(unitToKg(135, 'lb')).toBe(unitToKg(135, 'lb'));
  });

  it('formatea pesos', () => {
    expect(formatWeight(60, 'kg')).toBe('60 kg');
    expect(formatWeight(62.5, 'kg')).toBe('62.5 kg');
    expect(formatWeight(unitToKg(135, 'lb'), 'lb')).toBe('135 lb');
    expect(formatWeight(60, 'lb')).toBe('132.28 lb');
    expect(formatWeight(0, 'kg')).toBe('0 kg');
  });

  it('formatea diferencias con signo', () => {
    expect(formatSignedWeight(5, 'kg')).toBe('+5 kg');
    expect(formatSignedWeight(-2.5, 'kg')).toBe('-2.5 kg');
    expect(formatSignedWeight(unitToKg(5, 'lb'), 'lb')).toBe('+5 lb');
    expect(formatSignedWeight(0, 'kg')).toBe('0 kg');
  });

  it('formatea volumen en la unidad elegida', () => {
    expect(formatVolume(600, 'kg')).toBe('600 kg');
    expect(formatVolume(600, 'lb')).toBe(`${Math.round(600 / 0.45359237).toLocaleString('es-MX')} lb`);
    expect(formatSignedVolume(100, 'kg')).toBe('+100 kg');
    expect(formatSignedVolume(-100, 'kg')).toBe('-100 kg');
  });
});
