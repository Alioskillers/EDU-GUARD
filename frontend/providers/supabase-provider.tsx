'use client';

import { Session, SupabaseClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ReactNode, useState } from 'react';
import { createBrowserClient } from '../lib/supabase-browser-client';

interface SupabaseProviderProps {
  initialSession: Session | null;
  children: ReactNode;
}

export function SupabaseProvider({ initialSession, children }: SupabaseProviderProps) {
  const [supabaseClient] = useState<SupabaseClient>(() => createBrowserClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
