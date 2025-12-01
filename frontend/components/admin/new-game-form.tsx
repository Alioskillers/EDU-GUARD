'use client';

import { useState } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';

export function NewGameForm() {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    subject: '',
    min_age_group: '',
    max_age_group: '',
    estimated_duration_minutes: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    await authedClientFetch('/games', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    setMessage('Game created! Refresh to see it in the list.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          placeholder="Title"
          className="rounded-2xl border border-slate-200 px-4 py-3"
          value={form.title}
          onChange={(event) => handleChange('title', event.target.value)}
        />
        <input
          required
          placeholder="URL identifier (e.g., galaxy-math-quest)"
          className="rounded-2xl border border-slate-200 px-4 py-3"
          value={form.slug}
          onChange={(event) => handleChange('slug', event.target.value)}
        />
      </div>
      <textarea
        required
        placeholder="Description"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        value={form.description}
        onChange={(event) => handleChange('description', event.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <select
          required
          value={form.subject}
          onChange={(event) => handleChange('subject', event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="">Select subject</option>
          {['PHYSICS', 'CHEMISTRY', 'MATH', 'LANGUAGE', 'CODING', 'OTHER'].map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <select
          required
          value={form.min_age_group}
          onChange={(event) => handleChange('min_age_group', event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="">Min age group</option>
          {['3_5', '6_8', '9_12'].map((group) => (
            <option key={group} value={group}>Ages {group.replace('_', '-')}</option>
          ))}
        </select>
        <select
          required
          value={form.max_age_group}
          onChange={(event) => handleChange('max_age_group', event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="">Max age group</option>
          {['3_5', '6_8', '9_12'].map((group) => (
            <option key={group} value={group}>Ages {group.replace('_', '-')}</option>
          ))}
        </select>
      </div>
      <input
        type="number"
        required
        min="1"
        placeholder="Estimated duration in minutes (e.g., 10)"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        value={form.estimated_duration_minutes > 0 ? form.estimated_duration_minutes : ''}
        onChange={(event) => handleChange('estimated_duration_minutes', Number(event.target.value) || 0)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Create game'}
      </Button>
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
    </form>
  );
}
