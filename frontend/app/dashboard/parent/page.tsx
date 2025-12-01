import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchProfile, fetchMonitoringSummary, fetchAlerts, fetchChildSessions } from '../../../lib/api';
import { pathForRole } from '../../../lib/roles';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AddChildForm } from '../../../components/parent/add-child-form';

export const dynamic = 'force-dynamic';

function ScreenTimeSparkline({ data }: { data: { day: string; minutes: number }[] }) {
  const max = Math.max(60, ...data.map((point) => point.minutes));
  return (
    <div className="flex h-16 items-end gap-2">
      {data.map((point) => (
        <div key={point.day} className="flex-1 rounded-full bg-brand-200" style={{ height: `${(point.minutes / max) * 100}%` }} />
      ))}
    </div>
  );
}

export default async function ParentDashboard() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch {
    redirect('/auth/sign-in');
  }

  if (profile.role !== 'PARENT') {
    redirect(pathForRole(profile.role));
  }

  const children = profile.children ?? [];

  const childWidgets = await Promise.all(
    children.map(async (child) => {
      const [summary, alerts, sessions] = await Promise.all([
        fetchMonitoringSummary(child.id).catch(() => ({ total_minutes: 0, by_day: [], by_type: [] })),
        fetchAlerts(child.id).catch(() => []),
        fetchChildSessions(child.id).catch(() => []),
      ]);

      return { child, summary, alerts, sessions };
    }),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-sm font-semibold text-brand-500">Welcome, {profile.full_name}!</p>
        <h1 className="font-display text-4xl text-midnight">Your family&apos;s Play, Learn & Protect hub</h1>
        <p className="mt-2 text-slate-600">
          Review each child&apos;s playtime, celebrate wins, and follow up on gentle alerts designed to spark healthy conversations.
        </p>
      </section>

      <section className="space-y-6">
        <Card className="p-6">
          <h2 className="font-display text-xl mb-4">Add Child Profile</h2>
          <AddChildForm />
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {childWidgets.map(({ child, summary, alerts, sessions }) => (
          <Card key={child.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">{child.relationship}</p>
                <h2 className="font-display text-2xl">{child.display_name}</h2>
                <p className="text-sm text-slate-500">Age {child.age} · Group {child.age_group}</p>
              </div>
              <Button asChild variant="secondary">
                <Link href={`/parent/children/${child.id}`}>View details</Link>
              </Button>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Screen time (7 days)</p>
              <ScreenTimeSparkline data={summary.by_day.slice(-7)} />
              <p className="text-xs text-slate-500">
                Total {Math.round(summary.total_minutes)} minutes · {alerts.filter((alert) => !alert.resolved).length} open alerts
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-600">Recent play</p>
              {sessions.slice(0, 2).map((session) => (
                <p key={session.id} className="text-slate-500">
                  {session.title} · {session.completed ? 'Finished' : 'In progress'}
                </p>
              ))}
              {sessions.length === 0 && <p className="text-slate-400">No sessions yet.</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-600">
                Latest alerts {alerts.filter((a) => !a.resolved).length > 0 && (
                  <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {alerts.filter((a) => !a.resolved).length} new
                  </span>
                )}
              </p>
              {alerts
                .filter((alert) => !alert.resolved)
                .slice(0, 3)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      alert.severity === 'HIGH'
                        ? 'border-rose-200 bg-rose-50'
                        : alert.severity === 'MEDIUM'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          alert.severity === 'HIGH'
                            ? 'text-rose-700'
                            : alert.severity === 'MEDIUM'
                              ? 'text-orange-700'
                              : 'text-yellow-700'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(alert.generated_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              {alerts.filter((a) => !a.resolved).length === 0 && (
                <p className="text-xs text-slate-400">No active alerts 🎉</p>
              )}
              {alerts.filter((a) => !a.resolved).length > 3 && (
                <Button asChild variant="ghost" className="w-full text-xs">
                  <Link href="/notifications">View all alerts</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
        {children.length === 0 && <Card>No children are linked yet. Invite them with a guardian code.</Card>}
      </section>
    </div>
  );
}
