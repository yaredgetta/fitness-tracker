import { formatDuration, elapsedSeconds } from '../src/utils/dates';

it('formatea duraciones', () => {
  expect(formatDuration(125)).toBe('2:05');
  expect(formatDuration(3725)).toBe('1:02:05');
  expect(formatDuration(-4)).toBe('0:00');
});
it('calcula segundos transcurridos', () => {
  expect(elapsedSeconds('2026-11-10T10:00:00Z', new Date('2026-11-10T10:01:30Z'))).toBe(90);
});
