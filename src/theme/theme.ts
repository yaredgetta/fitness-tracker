export const colors = {
  background: '#0C0C0E',
  surface: '#17171B',
  surfaceRaised: '#202026',
  border: '#2A2A31',
  text: '#F2F2F4',
  textMuted: '#8E8E98',
  accent: '#FF6A2B',
  accentSoft: 'rgba(255, 106, 43, 0.16)',
  success: '#3DDC84',
  danger: '#FF5A5F',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;

/** Intensidad del mapa muscular: sin entrenamiento, bajo, medio, alto. */
export const HEAT_COLORS = ['#2E2E36', '#6E3519', '#B24E22', '#FF6A2B'] as const;
export const BODY_BASE_COLOR = '#202026';
