import { createAutosaver } from '../src/storage/autosave';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('autoguardado', () => {
  it('agrupa cambios seguidos y guarda solo el último', async () => {
    const save = vi.fn();
    const a = createAutosaver<number>(save, 500);
    a.schedule(1); a.schedule(2); a.schedule(3);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(3);
  });

  it('flush guarda de inmediato lo pendiente', async () => {
    const save = vi.fn();
    const a = createAutosaver<string>(save, 500);
    a.schedule('x');
    await a.flush();
    expect(save).toHaveBeenCalledWith('x');
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('cancel descarta lo pendiente', async () => {
    const save = vi.fn();
    const a = createAutosaver<string>(save, 500);
    a.schedule('x');
    a.cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
  });
});
