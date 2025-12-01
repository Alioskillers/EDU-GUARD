import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, rtlLocales } from './i18n/config';

export async function middleware(request: NextRequest) {
  try {
    // Handle locale from cookie
    const locale = request.cookies.get('locale')?.value || 'en';
    const validLocale = locales.includes(locale as any) ? locale : 'en';
    const dir = rtlLocales.includes(validLocale as any) ? 'rtl' : 'ltr';

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Set locale and dir in response headers
    response.headers.set('x-next-intl-locale', validLocale);
    response.headers.set('x-next-intl-dir', dir);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Use getUser() first to verify authentication (more secure)
    // This also refreshes the session if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is authenticated, the session is automatically refreshed
    // We don't need to call getSession() separately
    if (user) {
      // Session is automatically refreshed by getUser()
      // Cookies are set by the middleware's cookie handler
    }

    return response;
  } catch (error) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
