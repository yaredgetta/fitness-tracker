import { compareExercise, compareSet } from '../src/utils/compare';

const L = (weight: number, reps: number) => ({ weight, reps });

describe('comparación por serie', () => {
  it('sin serie previa -> nueva', () => expect(compareSet(L(60, 10), undefined).trend).toBe('new'));
  it('mismo resultado -> se mantiene', () => expect(compareSet(L(60, 10), L(60, 10)).trend).toBe('same'));
  it('más peso, mismas reps -> mejora', () => {
    expect(compareSet(L(65, 10), L(60, 10))).toMatchObject({ trend: 'up', weightDelta: 5 });
  });
  it('mismas reps con más peso se ve en volumen', () => {
    expect(compareSet(L(65, 10), L(60, 10)).volumeDelta).toBe(50);
  });
  it('más reps con mismo peso -> mejora', () => expect(compareSet(L(60, 12), L(60, 10)).trend).toBe('up'));
  it('menos reps con mismo peso -> baja', () => expect(compareSet(L(60, 9), L(60, 10)).trend).toBe('down'));
  it('subir peso con caída fuerte de reps NO es mejora', () => {
    expect(compareSet(L(65, 7), L(60, 10)).trend).toBe('down'); // -24 % de volumen
  });
  it('subir peso con caída leve sí es mejora', () => {
    expect(compareSet(L(65, 9), L(60, 10)).trend).toBe('up'); // -2.5 %
  });
  it('mismo volumen con menos peso -> se mantiene', () => {
    expect(compareSet(L(50, 12), L(60, 10)).trend).toBe('same');
  });
  it('peso corporal compara repeticiones', () => {
    expect(compareSet(L(0, 12), L(0, 10)).trend).toBe('up');
    expect(compareSet(L(0, 8), L(0, 10)).trend).toBe('down');
  });
});

describe('comparación por ejercicio', () => {
  it('calcula diferencias y tendencia', () => {
    const c = compareExercise([L(65, 10), L(65, 10)], [L(60, 10), L(60, 10)]);
    expect(c).toMatchObject({ trend: 'up', volumeDelta: 100, maxWeightDelta: 5, setsDelta: 0 });
  });
  it('mismo peso con menos volumen -> baja', () => {
    expect(compareExercise([L(60, 10)], [L(60, 10), L(60, 10)]).trend).toBe('down');
  });
  it('más peso máximo pero mucho menos volumen -> baja', () => {
    expect(compareExercise([L(70, 3)], [L(60, 10), L(60, 10)]).trend).toBe('down');
  });
});
