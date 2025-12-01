// NFR-08: Localization support - 7 languages
// This file contains constants that can be imported by both client and server components
export const locales = ['en', 'ar', 'fr', 'de', 'es', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

