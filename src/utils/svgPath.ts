/**
 * Refleja horizontalmente una ruta SVG absoluta (solo comandos M, L, C, Q, Z).
 * Permite definir solo la mitad del cuerpo y generar la otra.
 */
export function mirrorPath(d: string, width = 200): string {
  const round = (n: number) => Math.round(n * 100) / 100;
  return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_m, cmd: string, args: string) => {
    const nums = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    return cmd + nums.map((n, i) => (i % 2 === 0 ? round(width - n) : n)).join(' ');
  });
}
