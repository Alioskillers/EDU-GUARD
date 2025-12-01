import type { Metadata } from 'next';
import { Baloo_2, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '../providers/supabase-provider';
import { SiteHeader } from '../components/layout/site-header';
import { getServerSession } from '../lib/supabase-server';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { locales, rtlLocales } from '../i18n/config';

const baloo = Baloo_2({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['cursive', 'system-ui'],
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Play, Learn & Protect',
  description: 'Technology for curious kids, caring parents, and inspiring teachers.',
};

// Mark layout as dynamic since it uses cookies for session management
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  
  // Get locale from next-intl (which reads from cookies via request config)
  const locale = await getLocale();
  const validLocale = locales.includes(locale as typeof locales[number]) ? (locale as typeof locales[number]) : 'en';
  const messages = await getMessages();
  const dir = rtlLocales.includes(validLocale) ? 'rtl' : 'ltr';

  return (
    <html lang={validLocale} dir={dir} className={`${baloo.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f7ff,_#e8ecff)] text-slate-900" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <SupabaseProvider initialSession={session}>
            <SiteHeader />
            <main className="mx-auto mt-8 max-w-6xl px-4 pb-16 text-slate-900">{children}</main>
          </SupabaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
