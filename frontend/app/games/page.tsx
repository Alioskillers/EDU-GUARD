import Link from 'next/link';
import { fetchGames } from '../../lib/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface GamesPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const subjects = ['PHYSICS', 'CHEMISTRY', 'MATH', 'LANGUAGE', 'CODING', 'OTHER'];
const ageGroups = ['3_5', '6_8', '9_12'];

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const games = await fetchGames({ subject: params.subject, age_group: params.age_group }).catch(() => []);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <h1 className="font-display text-4xl text-midnight">Game Library</h1>
        <p className="text-slate-600">Choose by subject or age range. Every activity is family-friendly.</p>
        <form className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <select name="subject" defaultValue={params.subject} className="rounded-full border border-slate-200 px-4 py-2">
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
          <select name="age_group" defaultValue={params.age_group} className="rounded-full border border-slate-200 px-4 py-2">
            <option value="">All ages</option>
            {ageGroups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {games.map((game) => (
          <Card key={game.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase text-brand-500">{game.subject}</p>
            <h2 className="font-display text-2xl text-midnight">{game.title}</h2>
            <p className="text-sm text-slate-500">{game.description}</p>
            <p className="text-xs text-slate-400">Ages {game.min_age_group.replace('_', '-')} to {game.max_age_group.replace('_', '-')} · {game.estimated_duration_minutes} min</p>
            <Button asChild>
              <Link href={`/games/${game.slug}`}>Play</Link>
            </Button>
          </Card>
        ))}
        {games.length === 0 && <Card>No games match those filters yet.</Card>}
      </section>
    </div>
  );
}
