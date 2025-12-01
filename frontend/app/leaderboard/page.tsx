'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authedClientFetch } from '../../lib/client-api';
import { LeaderboardEntry } from '../../lib/types';
import { Card } from '../../components/ui/card';

const ageGroups = ['3_5', '6_8', '9_12'];

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const ageGroup = searchParams.get('age_group') ?? undefined;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const suffix = ageGroup ? `?age_group=${ageGroup}` : '';
        const data = await authedClientFetch(`/leaderboard${suffix}`) as LeaderboardEntry[];
        setLeaderboard(data);
      } catch (err: any) {
        setLeaderboard([]);
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ageGroup]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <h1 className="font-display text-4xl text-midnight">Leaderboard</h1>
        <p className="text-slate-600">Celebrate kindness points and steady learning progress.</p>
        <form className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500" action="/leaderboard" method="get">
          <select name="age_group" defaultValue={ageGroup ?? ''} className="rounded-full border border-slate-200 px-4 py-2">
            <option value="">All age groups</option>
            {ageGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <button type="submit" className="rounded-full border border-slate-200 px-4 py-2">Filter</button>
        </form>
      </section>
      <section>
        <Card className="divide-y divide-slate-100">
          {loading ? (
            <p className="py-4 text-sm text-slate-500">Loading...</p>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((child, index) => (
              <div key={child.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-slate-800">#{index + 1} {child.display_name}</p>
                  <p className="text-xs text-slate-500">Age group {child.age_group}</p>
                </div>
                <p className="text-lg font-bold text-brand-600">{child.points} pts</p>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">
              {error ? (
                <span className="text-rose-500">{error}</span>
              ) : (
                'No players yet.'
              )}
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
          <h1 className="font-display text-4xl text-midnight">Leaderboard</h1>
          <p className="text-slate-600">Celebrate kindness points and steady learning progress.</p>
        </section>
        <Card>
          <p className="py-4 text-sm text-slate-500">Loading...</p>
        </Card>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
