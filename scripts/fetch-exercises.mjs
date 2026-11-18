#!/usr/bin/env node
/**
 * Descarga el catálogo de ejercicios y crea assets/data/exercises.json.
 *
 *   npm run fetch:exercises
 *
 * Fuente: https://github.com/JahelCuadrado/ExerciseGymGifsDB (servido por jsDelivr).
 * Para usar otra versión (etiqueta de git):  EXERCISES_VERSION=vX.Y.Z npm run fetch:exercises
 * v1.1.0 es la última estable; la 1.2.0 sigue en desarrollo y puede no existir todavía.
 *
 * El autor del catálogo no concede derechos de redistribución (ver README, "Datos y créditos"),
 * por eso el archivo se descarga y no se sube al repositorio.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCatalog } from './buildCatalog.mjs';

const VERSION = process.env.EXERCISES_VERSION || 'v1.1.0';
const BASE = `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@${VERSION}`;
const OUT = path.resolve(process.cwd(), 'assets/data/exercises.json');

async function download(lang) {
  const url = `${BASE}/api/${lang}/exercises.json`;
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (HTTP ${res.status}).`);
  return res.json();
}

try {
  console.log(`Descargando catálogo de ejercicios (${VERSION})…`);
  const [es, en] = await Promise.all([download('es'), download('en')]);
  const { catalog, warnings } = buildCatalog(es, en);

  if (catalog.count < 1000) {
    throw new Error(`Solo se encontraron ${catalog.count} ejercicios; se esperaban más de 1000. No se guardó nada.`);
  }
  for (const w of warnings.slice(0, 10)) console.warn(`  ⚠ ${w}`);
  if (warnings.length > 10) console.warn(`  ⚠ …y ${warnings.length - 10} avisos más`);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(catalog));
  console.log(`✔ ${catalog.count} ejercicios guardados en ${path.relative(process.cwd(), OUT)}`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  console.error('  Revisa tu conexión o prueba otra versión con EXERCISES_VERSION=…');
  process.exit(1);
}
