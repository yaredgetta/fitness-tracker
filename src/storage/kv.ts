/** Contrato mínimo de almacenamiento clave-valor (compatible con AsyncStorage). */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

let store: KeyValueStore | null = null;

/** Permite inyectar otro almacenamiento (pruebas). */
export function setKeyValueStore(s: KeyValueStore | null): void {
  store = s;
}

export function getKeyValueStore(): KeyValueStore {
  if (!store) {
    // require diferido: evita cargar el módulo nativo fuera de React Native.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    store = (mod.default ?? mod) as KeyValueStore;
  }
  return store;
}
