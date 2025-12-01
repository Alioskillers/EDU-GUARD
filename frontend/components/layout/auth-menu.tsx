'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '../../lib/supabase-browser-client';
import Link from 'next/link';
import { Button } from '../ui/button';

export function AuthMenu() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUserEmail(data.user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUserEmail(session?.user?.email ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!mounted || !userEmail) {
    return (
      <Button asChild>
        <Link href="/auth/sign-in">Sign In</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-slate-500 sm:block">{userEmail}</span>
      <Button
        variant="ghost"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/');
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
