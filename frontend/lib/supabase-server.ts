import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Use getUser() first to verify authentication (more secure)
    // This ensures the user is actually authenticated with Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    // After getUser() succeeds, get the session for the access token
    // getUser() refreshes the session, so this is safe now
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return null;
    }
    
    // Return the session with the access token
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

