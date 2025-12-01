'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '../../lib/supabase-browser-client';
import { Button } from '../ui/button';
import { AuthMenu } from './auth-menu';
import { LanguageSwitcher } from './language-switcher';
import { pathForRole } from '../../lib/roles';
import { env } from '../../lib/env';

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const links = [
    { href: '/games', label: t('common.games') },
    { href: '/leaderboard', label: t('common.leaderboard') },
    { href: '/me/achievements', label: t('common.myAchievements') },
    { href: '/creative', label: t('common.creativeSpace'), role: 'CHILD' as const },
    { href: '/notifications', label: t('common.notifications'), role: ['PARENT', 'TEACHER', 'ADMIN'] as const },
  ];

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    const checkAuth = async () => {
      // Use getUser() first to verify authentication (more secure)
      const { data } = await supabase.auth.getUser();
      if (isMounted && data.user) {
        setIsAuthenticated(true);
        // Try to get role from backend
        try {
          // After getUser() succeeds, get the session for the access token
          const session = await supabase.auth.getSession();
          if (session.data.session) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            try {
              const response = await fetch(`${env.apiBase}/me`, {
                headers: {
                  'Authorization': `Bearer ${session.data.session.access_token}`,
                },
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const profile = await response.json();
                setUserRole(profile.role);
              } else {
                // Fallback to metadata role
                setUserRole(data.user.user_metadata?.role || null);
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              // Silently fallback to metadata role if backend is unavailable
              // Don't log connection errors as they're expected when backend is down
              if (fetchError.name !== 'AbortError' && 
                  !fetchError.message?.includes('Failed to fetch') &&
                  !fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.warn('Failed to fetch user role from backend:', fetchError.message);
              }
              setUserRole(data.user.user_metadata?.role || null);
            }
          } else {
            setUserRole(data.user.user_metadata?.role || null);
          }
        } catch {
          // Fallback to metadata role
          setUserRole(data.user.user_metadata?.role || null);
        }
      } else if (isMounted) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role || null);
        } else {
          setUserRole(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const dashboardPath = userRole ? pathForRole(userRole) : '/dashboard/child';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-display text-brand-700">
          {t('common.playLearnProtect')}
        </Link>
        <nav className="hidden gap-6 text-sm font-semibold text-slate-600 md:flex">
          {links
            .filter((link) => {
              if (!link.role) return true;
              if (!mounted || !isAuthenticated) return false;
              if (Array.isArray(link.role)) {
                return link.role.includes(userRole as any);
              }
              return userRole === link.role;
            })
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname?.startsWith(link.href) ? 'text-brand-600' : 'text-slate-600'}
              >
                {link.label}
              </Link>
            ))}
          {mounted && isAuthenticated && (
            <Link
              href={dashboardPath}
              className={pathname?.startsWith('/dashboard') ? 'text-brand-600' : 'text-slate-600'}
            >
              {t('common.dashboard')}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {mounted && !isAuthenticated && (
            <Button asChild variant="secondary" className="hidden md:inline-flex">
              <Link href="/auth/sign-up">{t('common.signUp')}</Link>
            </Button>
          )}
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
