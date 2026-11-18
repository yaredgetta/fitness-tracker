export interface Autosaver<T> {
  /** Programa un guardado; si llegan varios seguidos solo se escribe el último. */
  schedule(value: T): void;
  /** Escribe de inmediato lo pendiente (p. ej. al pasar la app a segundo plano). */
  flush(): Promise<void>;
  /** Descarta lo pendiente (p. ej. al finalizar o descartar la sesión). */
  cancel(): void;
}

export function createAutosaver<T>(
  save: (value: T) => Promise<void> | void,
  delayMs = 500,
): Autosaver<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const run = async () => {
    timer = null;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    await save(value);
  };

  return {
    schedule(value) {
      pending = { value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delayMs);
    },
    async flush() {
      if (timer) clearTimeout(timer);
      await run();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
