import { notFound, redirect } from 'next/navigation';
import { fetchProfile, fetchMonitoringSummary, fetchAlerts, fetchChildSessions, fetchChildAchievements } from '../../../../lib/api';
import { pathForRole } from '../../../../lib/roles';
import { Card } from '../../../../components/ui/card';
import { ResolveAlertButton } from '../../../../components/alerts/resolve-alert-button';

export const dynamic = 'force-dynamic';

interface Params {
  childId: string;
}

export default async function ParentChildDetail({ params }: { params: Promise<Params> }) {
  const { childId } = await params;
  
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch {
    redirect('/auth/sign-in');
  }

  if (profile.role !== 'PARENT') {
    redirect(pathForRole(profile.role));
  }
  const child = profile.children?.find((c) => c.id === childId);

  if (!child) {
    notFound();
  }

  const [summary, alerts, sessions, achievements] = await Promise.all([
    fetchMonitoringSummary(child.id).catch(() => ({ total_minutes: 0, by_day: [], by_type: [] })),
    fetchAlerts(child.id).catch(() => []),
    fetchChildSessions(child.id).catch(() => []),
    fetchChildAchievements(child.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-sm font-semibold text-brand-500">{child.relationship}</p>
        <h1 className="font-display text-4xl text-midnight">{child.display_name}</h1>
        <p className="text-slate-500">Age {child.age} · Age group {child.age_group}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total screen time (7d)</p>
          <p className="text-3xl font-bold text-brand-600">{Math.round(summary.total_minutes)} min</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Badges</p>
          <p className="text-3xl font-bold text-learn">{achievements.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Active alerts</p>
          <p className="text-3xl font-bold text-protect">{alerts.filter((alert) => !alert.resolved).length}</p>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-display text-xl">Recent sessions</h2>
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-700">{session.title}</p>
              <p className="text-xs text-slate-500">{session.completed ? 'Completed' : 'In progress'} · {new Date(session.started_at).toLocaleString()}</p>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-slate-500">No sessions yet.</p>}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-display text-xl">Alerts</h2>
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-rose-600">{alert.alert_type.replace('_', ' ')}</p>
                {!alert.resolved && <ResolveAlertButton alertId={alert.id} />}
              </div>
              <p className="text-xs text-slate-600">{alert.message}</p>
              <p className="text-xs text-slate-400">{new Date(alert.generated_at).toLocaleString()}</p>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-slate-500">No alerts 🎉</p>}
        </Card>
      </section>
    </div>
  );
}
