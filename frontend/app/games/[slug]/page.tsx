import { fetchGame, fetchProfile } from '../../../lib/api';
import { MathQuest } from '../../../components/games/math-quest';
import { WordGarden } from '../../../components/games/word-garden';
import { Card } from '../../../components/ui/card';

interface Params {
  slug: string;
}

export const dynamic = 'force-dynamic';

export default async function GameDetail({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  
  if (!slug) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-rose-500">Invalid game URL. Please select a game from the games page.</p>
        </Card>
      </div>
    );
  }

  let game;
  try {
    game = await fetchGame(slug);
  } catch (error) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-rose-500">
            {error instanceof Error ? error.message : 'Game not found. Please check the URL and try again.'}
          </p>
        </Card>
      </div>
    );
  }

  const profile = await fetchProfile().catch(() => null);

  const childId = profile?.child_profile?.id ?? null;
  const childAgeGroup = profile?.child_profile?.age_group;

  // FR-12: Content Filtering & Age Restrictions
  const isAgeRestricted = (() => {
    if (!childAgeGroup) return false;
    // Check if child's age group is within game's allowed range
    const ageGroupOrder = { '3_5': 1, '6_8': 2, '9_12': 3 };
    const childOrder = ageGroupOrder[childAgeGroup as keyof typeof ageGroupOrder] || 0;
    const minOrder = ageGroupOrder[game.min_age_group as keyof typeof ageGroupOrder] || 0;
    const maxOrder = ageGroupOrder[game.max_age_group as keyof typeof ageGroupOrder] || 0;
    return childOrder < minOrder || childOrder > maxOrder;
  })();

  const gameComponent = (() => {
    if (!profile) {
      return <p className="text-sm text-rose-500">Sign in to play and track your progress.</p>;
    }

    if (!childId) {
      return <p className="text-sm text-rose-500">Only child accounts can launch game sessions.</p>;
    }

    if (isAgeRestricted) {
      return (
        <div className="space-y-3 p-6 text-center">
          <p className="text-lg font-semibold text-rose-600">⛔ Age Restriction</p>
          <p className="text-sm text-slate-600">
            This game is for ages {game.min_age_group.replace('_', '-')} to {game.max_age_group.replace('_', '-')}.
            <br />
            Your age group ({childAgeGroup?.replace('_', '-')}) is not within this range.
          </p>
          <p className="text-xs text-slate-500">Please choose a game appropriate for your age group.</p>
        </div>
      );
    }

    if (game.subject === 'MATH') {
      return <MathQuest childId={childId} gameId={game.id} />;
    }

    return <WordGarden childId={childId} gameId={game.id} />;
  })();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-white p-8 shadow-xl shadow-brand-900/5">
        <p className="text-xs uppercase text-brand-500">{game.subject}</p>
        <h1 className="font-display text-4xl text-midnight">{game.title}</h1>
        <p className="text-slate-600">{game.description}</p>
        <p className="mt-2 text-xs text-slate-400">
          Ages {game.min_age_group.replace('_', '-')} to {game.max_age_group.replace('_', '-')} · {game.estimated_duration_minutes} minutes
        </p>
      </section>
      <Card>{gameComponent}</Card>
    </div>
  );
}
