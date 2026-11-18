export const KEYS = {
  user: '@ft/user',
  sessionIndex: '@ft/sessionIndex',
  activeSession: '@ft/activeSession',
  settings: '@ft/settings',
  customExercises: '@ft/customExercises',
  sessionPrefix: '@ft/session/',
  session: (id: string) => `@ft/session/${id}`,
} as const;
