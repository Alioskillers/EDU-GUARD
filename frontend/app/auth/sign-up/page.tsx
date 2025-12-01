'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '../../../lib/supabase-browser-client';
import { Button } from '../../../components/ui/button';
import { useRouter } from 'next/navigation';

const roles = [
  { label: 'Child player', value: 'CHILD' },
  { label: 'Parent / Guardian', value: 'PARENT' },
  { label: 'Teacher', value: 'TEACHER' },
  // Note: ADMIN role should be assigned manually for security
];

export default function SignUpPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'PARENT',
    parent_email: '',
    age: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Calculate age_group from age for CHILD users
    let ageGroup: string | undefined;
    if (form.role === 'CHILD' && form.age) {
      const age = parseInt(form.age, 10);
      if (age >= 3 && age <= 5) {
        ageGroup = '3_5';
      } else if (age >= 6 && age <= 8) {
        ageGroup = '6_8';
      } else if (age >= 9 && age <= 12) {
        ageGroup = '9_12';
      }
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role: form.role,
          full_name: form.full_name,
          parent_email: form.parent_email,
          age: form.role === 'CHILD' ? form.age : undefined,
          age_group: ageGroup,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage('Check your inbox to confirm your email and start playing!');
    setTimeout(() => router.push('/auth/sign-in'), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl bg-white p-8 shadow-xl">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Join EduGuard</p>
        <h1 className="font-display text-3xl text-midnight">Create your account</h1>
        <p className="text-sm text-slate-500">Set your role to unlock the right dashboard.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-600">Full name</label>
          <input
            required
            value={form.full_name}
            onChange={(event) => updateField('full_name', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600">I&apos;m signing up as</label>
          <select
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-400 focus:outline-none"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        {form.role === 'CHILD' && (
          <>
            <div>
              <label className="text-sm font-semibold text-slate-600">Age</label>
              <input
                type="number"
                min="3"
                max="12"
                required
                value={form.age}
                onChange={(event) => updateField('age', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
                placeholder="Enter age (3-12)"
              />
              <p className="mt-1 text-xs text-slate-500">We'll match you with age-appropriate games.</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Parent or guardian email</label>
              <input
                type="email"
                required
                value={form.parent_email}
                onChange={(event) => updateField('parent_email', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">We send a linking code so your grown-up can approve.</p>
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </div>
      </form>
      {error ? <p className="text-center text-sm text-rose-500">{error}</p> : null}
      {message ? <p className="text-center text-sm text-emerald-600">{message}</p> : null}
      <p className="text-center text-sm text-slate-500">
        Already have an account? <Link href="/auth/sign-in" className="text-brand-600 underline">Sign in</Link>
      </p>
    </div>
  );
}
