import { redirect } from 'next/navigation';
import { fetchProfile } from '../../lib/api';
import { pathForRole } from '../../lib/roles';
import { CreativeSpace } from '../../components/creative/creative-space';

export const dynamic = 'force-dynamic';

export default async function CreativePage() {
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

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-xs uppercase text-brand-500">Creative Learning Space</p>
        <h1 className="font-display text-4xl text-midnight">Your Creative Playground</h1>
        <p className="text-slate-600">Draw, write stories, or build with code blocks. Save your creations and share them!</p>
      </section>
      <CreativeSpace childId={childId} />
    </div>
  );
}

