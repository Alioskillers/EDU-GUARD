'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { locales, rtlLocales, type Locale } from '../../i18n/config';

// NFR-08: Language switcher with 7 languages support
const languageNames: Record<Locale, string> = {
  en: '🇬🇧 English',
  ar: '🇸🇦 العربية',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  es: '🇪🇸 Español',
  ja: '🇯🇵 日本語',
  zh: '🇨🇳 中文',
};

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Try to get locale from cookie first (server preference), then localStorage
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined;
    const saved = (cookieLocale || localStorage.getItem('locale')) as Locale | null;
    if (saved && locales.includes(saved)) {
      setLocale(saved);
      // Ensure cookie is set if we got it from localStorage
      if (!cookieLocale) {
        document.cookie = `locale=${saved}; path=/; max-age=31536000`;
      }
      document.documentElement.lang = saved;
      document.documentElement.dir = rtlLocales.includes(saved) ? 'rtl' : 'ltr';
    }
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    // Set both localStorage (for client-side) and cookie (for server-side)
    localStorage.setItem('locale', newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year expiry
    document.documentElement.lang = newLocale;
    document.documentElement.dir = rtlLocales.includes(newLocale) ? 'rtl' : 'ltr';
    setShowMenu(false);
    window.location.reload(); // Reload to apply new locale
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="text-sm"
      >
        {languageNames[locale]}
      </Button>
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white shadow-xl">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => changeLanguage(loc)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-2xl last:rounded-b-2xl ${
                  locale === loc ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-700'
                }`}
              >
                {languageNames[loc]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

