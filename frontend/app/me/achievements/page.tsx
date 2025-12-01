import { redirect } from 'next/navigation';
import { fetchProfile, fetchChildAchievements } from '../../../lib/api';
import { pathForRole } from '../../../lib/roles';
import { Card } from '../../../components/ui/card';

export const dynamic = 'force-dynamic';

export default async function MyAchievementsPage() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch (error) {
    // Log error for debugging
    console.error('Failed to fetch profile in achievements page:', error);
    redirect('/auth/sign-in');
  }

  if (!profile || !profile.role) {
    redirect('/auth/sign-in');
  }

  // Only CHILD users can view their achievements
  // Other roles should be redirected to their dashboard
  if (profile.role !== 'CHILD') {
    const redirectPath = pathForRole(profile.role);
    // Use redirect with replace to ensure navigation happens
    redirect(redirectPath);
  }

  const childId = profile.child_profile?.id;

  if (!childId) {
    return <p className="text-sm text-rose-500">No child profile found.</p>;
  }

  const achievements = await fetchChildAchievements(childId).catch(() => []);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <h1 className="font-display text-4xl text-midnight">My Achievements</h1>
        <p className="text-slate-600">Badges you have unlocked so far.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="space-y-1">
            <p className="text-xs uppercase text-brand-500">{achievement.code}</p>
            <h2 className="text-xl font-semibold text-midnight">{achievement.name}</h2>
            <p className="text-sm text-slate-500">{achievement.description}</p>
            <p className="text-xs text-slate-400">Earned {new Date(achievement.awarded_at ?? '').toLocaleDateString()}</p>
          </Card>
        ))}
        {achievements.length === 0 && <Card>No badges yet. Complete a game to earn your first one!</Card>}
      </section>
    </div>
  );
}
