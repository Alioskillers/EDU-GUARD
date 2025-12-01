import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchProfile, fetchGames, fetchLeaderboard } from '../../../lib/api';
import { pathForRole } from '../../../lib/roles';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { LeaderboardEntry } from '../../../lib/types';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch (error) {
    // Log the error for debugging
    console.error('Failed to fetch profile in teacher dashboard:', error);
    redirect('/auth/sign-in');
  }

  if (!profile || !profile.role) {
    console.error('Profile or role is missing');
    redirect('/auth/sign-in');
  }

  if (profile.role !== 'TEACHER') {
    redirect(pathForRole(profile.role));
  }

  const [games, leaderboard] = await Promise.all([
    fetchGames().catch(() => []),
    fetchLeaderboard().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-sm font-semibold text-brand-500">Hello, {profile.full_name}</p>
        <h1 className="font-display text-4xl text-midnight">Class insights at a glance</h1>
        <p className="text-slate-600">Share favorite games, celebrate badges, and keep an eye on wellbeing trends.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Active learners</p>
          <p className="text-3xl font-bold text-brand-600">{leaderboard.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Average points</p>
          <p className="text-3xl font-bold text-learn">
            {leaderboard.length
              ? Math.round(
                  leaderboard.reduce((sum: number, child: LeaderboardEntry) => sum + Number(child.points ?? 0), 0) /
                    leaderboard.length,
                )
              : 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Available games</p>
          <p className="text-3xl font-bold text-protect">{games.length}</p>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Popular games</h2>
            <Button asChild variant="ghost">
              <Link href="/games">Assign new game</Link>
            </Button>
          </div>
          {games.slice(0, 5).map((game) => (
            <div key={game.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-700">{game.title}</p>
              <p className="text-xs text-slate-500">{game.subject} · {game.estimated_duration_minutes} min</p>
            </div>
          ))}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-display text-xl">Top explorers</h2>
          {leaderboard.slice(0, 5).map((child: LeaderboardEntry, index: number) => (
            <div key={child.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-700">#{index + 1} {child.display_name}</p>
                <p className="text-xs text-slate-500">Age group {child.age_group}</p>
              </div>
              <p className="font-bold text-brand-600">{child.points} pts</p>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="text-sm text-slate-500">No players yet.</p>}
        </Card>
      </section>
    </div>
  );
}
