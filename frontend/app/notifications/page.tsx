import { redirect } from 'next/navigation';
import { fetchProfile } from '../../lib/api';
import { pathForRole } from '../../lib/roles';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { NotificationsList } from '../../components/notifications/notifications-list';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  let profile: Awaited<ReturnType<typeof fetchProfile>>;
  try {
    profile = await fetchProfile();
  } catch {
    redirect('/auth/sign-in');
  }

  // FR-11: Alerts & Notifications Center for parents and teachers
  if (profile.role !== 'PARENT' && profile.role !== 'TEACHER' && profile.role !== 'ADMIN') {
    redirect(pathForRole(profile.role));
  }

  const children = profile.children ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-xs uppercase text-brand-500">Notifications Center</p>
        <h1 className="font-display text-4xl text-midnight">Alerts & Notifications</h1>
        <p className="text-slate-600">
          Review all alerts including screen-time, cyberbullying detection, and content safety notifications.
        </p>
      </section>

      {profile.role === 'PARENT' && children.length > 0 && (
        <div className="space-y-6">
          {children.map((child) => (
            <Card key={child.id} className="p-6">
              <h2 className="font-display text-xl mb-4">{child.display_name}&apos;s Alerts</h2>
              <NotificationsList childId={child.id} />
            </Card>
          ))}
        </div>
      )}

      {(profile.role === 'TEACHER' || profile.role === 'ADMIN') && (
        <Card className="p-6">
          <h2 className="font-display text-xl mb-4">All Student Alerts</h2>
          <p className="text-sm text-slate-500 mb-4">
            View aggregated alerts across all students (anonymized for privacy).
          </p>
          <NotificationsList childId={null} role={profile.role} />
        </Card>
      )}

      {profile.role === 'PARENT' && children.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-slate-500">No children linked to your account yet.</p>
        </Card>
      )}
    </div>
  );
}

