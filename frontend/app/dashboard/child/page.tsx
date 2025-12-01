import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ProgressBar } from '../../../components/ui/progress';
import {
  fetchProfile,
  fetchChildAchievements,
  fetchChildSessions,
  fetchGames,
  fetchChildTotalPoints,
} from '../../../lib/api';
import { pathForRole } from '../../../lib/roles';

export const dynamic = 'force-dynamic';

export default async function ChildDashboard() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch {
    redirect('/auth/sign-in');
  }

  if (profile.role !== 'CHILD') {
    redirect(pathForRole(profile.role));
  }

  const childId = profile.child_profile?.id;

  if (!childId) {
    return <p className="text-sm text-rose-500">Your child profile is still being set up.</p>;
  }

  const [achievements, sessions, recommendations, totalPoints] = await Promise.all([
    fetchChildAchievements(childId).catch(() => []),
    fetchChildSessions(childId).catch(() => []),
    fetchGames({ age_group: profile.child_profile?.age_group }).catch(() => []),
    fetchChildTotalPoints(childId).catch(() => 0),
  ]);
  const inProgress = sessions.filter((session) => !session.completed).slice(0, 2);
  const finished = sessions.filter((session) => session.completed).slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {profile.child_profile?.avatar_url ? (
              <img
                src={profile.child_profile.avatar_url}
                alt={profile.child_profile.display_name}
                className="h-16 w-16 rounded-full border-2 border-brand-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-100 text-2xl font-bold text-brand-600">
                {profile.child_profile?.display_name?.charAt(0).toUpperCase() || '👤'}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-brand-500">Hi {profile.child_profile?.display_name}! 👋</p>
              <h1 className="font-display text-4xl text-midnight">You&apos;re doing great in the {profile.child_profile?.age_group?.replace('_', '–')} village.</h1>
            </div>
          </div>
          <p className="text-slate-600">
            Keep collecting badges to unlock new cosmic missions. Remember to pause for a stretch when you finish a level!
          </p>
          
          {/* Guardian Code Display */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-100 to-blue-100 border-2 border-brand-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-800 mb-1">🔒 Your Guardian Code</p>
                {profile.child_profile?.guardian_code ? (
                  <>
                    <p className="text-3xl font-mono font-bold text-brand-700 tracking-widest">
                      {profile.child_profile.guardian_code}
                    </p>
                    <p className="text-xs text-brand-600 mt-2">Share this 6-digit code with your parent so they can link your account</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-brand-600">Code is being generated...</p>
                    <p className="text-xs text-brand-600 mt-2">Your guardian code will appear here soon. Please refresh the page.</p>
                  </>
                )}
              </div>
              <div className="text-4xl">🔐</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-slate-500">Total points</p>
              <p className="text-3xl font-bold text-brand-600">{totalPoints}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Badges</p>
              <p className="text-3xl font-bold text-learn">{achievements.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Play streak</p>
              <p className="text-3xl font-bold text-protect">3 days</p>
            </Card>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl bg-brand-50 p-6">
          <p className="text-sm font-semibold text-brand-600">Weekly adventure</p>
          <ProgressBar 
            value={Math.min(100, ((totalPoints % 500) / 500) * 100)} 
            label={`${totalPoints} points · ${500 - (totalPoints % 500)} to next milestone`} 
          />
          <Button asChild className="w-full">
            <Link href="/games">Find a new game</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Continue playing</h2>
              <p className="text-sm text-slate-500">Pick up where you left off.</p>
            </div>
          </div>
          <div className="space-y-3">
            {inProgress.length === 0 && <p className="text-sm text-slate-500">No active sessions – launch a new game!</p>}
            {inProgress.map((session) => (
              <div key={session.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-brand-600">{session.title}</p>
                <p className="text-xs text-slate-500">Started {new Date(session.started_at).toLocaleDateString()}</p>
                <Button asChild variant="ghost" className="mt-2">
                  <Link href={`/games/${session.game_slug ?? session.game_id}`}>Resume</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-xl">Latest achievements</h2>
            <p className="text-sm text-slate-500">Way to go!</p>
          </div>
          <div className="space-y-3">
            {achievements.slice(0, 4).map((achievement) => (
              <div key={achievement.id} className="rounded-2xl bg-brand-50 px-4 py-3">
                <p className="font-semibold text-brand-700">{achievement.name}</p>
                <p className="text-xs text-slate-500">{achievement.description}</p>
              </div>
            ))}
            {achievements.length === 0 && <p className="text-sm text-slate-500">Complete a mission to unlock your first badge.</p>}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Recommended for you</h2>
            <p className="text-sm text-slate-500">Based on your age group.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/games">See all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.slice(0, 3).map((game) => (
            <Card key={game.id} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-brand-500">{game.subject}</p>
              <p className="font-semibold text-midnight">{game.title}</p>
              <p className="text-xs text-slate-500">{game.estimated_duration_minutes} min · Ages {game.min_age_group.replace('_', '-')}+</p>
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/games/${game.slug}`}>Play</Link>
              </Button>
            </Card>
          ))}
          {recommendations.length === 0 && <Card>No recommendations yet.</Card>}
        </div>
      </section>
    </div>
  );
}
