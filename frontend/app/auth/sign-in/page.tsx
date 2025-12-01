'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '../../../lib/supabase-browser-client';
import { Button } from '../../../components/ui/button';
import { useRouter } from 'next/navigation';
import { env } from '../../../lib/env';

export default function SignInPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setError('Failed to create session');
      return;
    }

    // Verify the session is valid by calling getUser() (more secure)
    // This also refreshes the session and ensures cookies are set
    await supabase.auth.getUser();

    // Fetch user profile from backend to get the correct role from database
    // If backend is unavailable, fall back to user_metadata role
    let role = (data.user?.user_metadata?.role as string) ?? 'CHILD';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${env.apiBase}/me`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const profile = await response.json();
        role = profile.role ?? data.user?.user_metadata?.role ?? 'CHILD';
        console.log('User role from backend:', role);
      } else if (response.status === 401) {
        // Token invalid - but we just signed in, so this shouldn't happen
        // Fall back to metadata role
        console.warn('Backend returned 401, using metadata role');
      } else {
        // Other error - backend might be having issues
        console.warn(`Backend returned ${response.status}, using metadata role`);
      }
    } catch (err: any) {
      // Backend unavailable, timeout, or network error
      // This is expected if backend is not running
      if (err.name !== 'AbortError') {
        console.warn('Backend unavailable, using metadata role:', err.message);
      }
    }

    // Navigate based on role
    let redirectPath = '/dashboard/child'; // default
    
    if (role === 'TEACHER') {
      redirectPath = '/dashboard/teacher';
    } else if (role === 'PARENT') {
      redirectPath = '/dashboard/parent';
    } else if (role === 'ADMIN') {
      redirectPath = '/dashboard/admin';
    } else if (role === 'CHILD') {
      redirectPath = '/dashboard/child';
    }
    
    console.log('Redirecting to:', redirectPath, 'for role:', role);
    
    setLoading(false);
    
    // getUser() already refreshed the session and set cookies
    // Wait a moment to ensure cookies are written to the browser
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use window.location for a full page reload
    // This ensures the middleware runs and processes the session cookies
    // before the server-side page component tries to read them
    window.location.href = redirectPath;
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Welcome back</p>
        <h1 className="font-display text-3xl text-midnight">Sign in to keep playing</h1>
        <p className="text-sm text-slate-500">Parents and teachers use the same login form.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Need an account? <Link href="/auth/sign-up" className="text-brand-600 underline">Sign up</Link>
      </p>
    </div>
  );
}
