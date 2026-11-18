export const SCHEMA_VERSION = 1;

interface Envelope<T> {
  schemaVersion: number;
  data: T;
}

export function wrap<T>(data: T): string {
  const env: Envelope<T> = { schemaVersion: SCHEMA_VERSION, data };
  return JSON.stringify(env);
}

/**
 * Lee un documento guardado. Devuelve null si no existe, está corrupto
 * tiene una forma inesperada (guard) o proviene de una versión más nueva que la app.
 * Aquí se aplicarán migraciones cuando schemaVersion cambie.
 */
export function unwrap<T>(raw: string | null, guard?: (data: unknown) => data is T): T | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope<T>;
    if (!env || typeof env.schemaVersion !== 'number' || env.schemaVersion > SCHEMA_VERSION) {
      return null;
    }
    if (guard && !guard(env.data)) return null;
    return (env.data ?? null) as T | null;
  } catch {
    return null;
  }
}
