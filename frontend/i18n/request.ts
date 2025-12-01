import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from cookie or use requestLocale
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const locale = (cookieLocale || requestLocale || 'en') as Locale;
  
  // Validate that the locale is valid
  const validLocale = locales.includes(locale) ? locale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
