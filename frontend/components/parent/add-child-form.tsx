'use client';

import { useState } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';

interface Props {
  onSuccess?: () => void;
}

export function AddChildForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    guardian_code: '',
    relationship: 'child',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Link child using guardian code only (secure method)
      await authedClientFetch('/parent/children/link', {
        method: 'POST',
        body: JSON.stringify({
          guardian_code: form.guardian_code,
          relationship: form.relationship,
        }),
      });

      setMessage('Child linked successfully using guardian code!');
      setForm({ guardian_code: '', relationship: 'child' });
      onSuccess?.();
    } catch (error: any) {
      setMessage(error.message || 'Failed to link child. Please check the guardian code and try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800 font-semibold mb-1">🔒 Secure Guardian Code</p>
        <p className="text-xs text-blue-700">
          Ask your child for their 6-digit guardian code. This secure method ensures only authorized parents can link accounts.
        </p>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Guardian Code
          </label>
          <input
            required
            type="text"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="Enter 6-digit code"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-2xl font-mono tracking-widest"
            value={form.guardian_code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setForm((prev) => ({ ...prev, guardian_code: value }));
            }}
          />
          <p className="text-xs text-slate-500 mt-1">Enter the 6-digit code provided by your child</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Relationship
          </label>
          <select
            required
            value={form.relationship}
            onChange={(e) => handleChange('relationship', e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="child">Child</option>
            <option value="son">Son</option>
            <option value="daughter">Daughter</option>
            <option value="ward">Ward</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Linking...' : 'Link Child Account'}
      </Button>
      {message && (
        <p className={`text-sm ${message.includes('Failed') || message.includes('Invalid') ? 'text-rose-600' : 'text-emerald-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}

