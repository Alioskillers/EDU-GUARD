import { redirect } from 'next/navigation';
import { fetchProfile, fetchGames, fetchAchievements } from '../../../lib/api';
import { pathForRole } from '../../../lib/roles';
import { Card } from '../../../components/ui/card';
import { NewGameForm } from '../../../components/admin/new-game-form';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch {
    redirect('/auth/sign-in');
  }

  if (profile.role !== 'ADMIN') {
    redirect(pathForRole(profile.role));
  }

  const [games, achievements] = await Promise.all([
    fetchGames().catch(() => []),
    fetchAchievements().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-sm font-semibold text-brand-500">Platform health</p>
        <h1 className="font-display text-4xl text-midnight">Admin control center</h1>
        <p className="text-slate-600">Manage content, review achievements, and seed the catalog.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Games live</p>
          <p className="text-3xl font-bold text-brand-600">{games.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Achievements</p>
          <p className="text-3xl font-bold text-learn">{achievements.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Admins</p>
          <p className="text-3xl font-bold text-protect">1</p>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-xl">Add a new game</h2>
          <NewGameForm />
        </Card>
        <Card className="space-y-3">
          <h2 className="font-display text-xl">Existing games</h2>
          {games.slice(0, 6).map((game) => (
            <div key={game.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-700">{game.title}</p>
              <p className="text-xs text-slate-500">URL: {game.slug} · {game.subject}</p>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
