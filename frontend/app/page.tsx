import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { fetchGames } from '../lib/api';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations();
  const games = await fetchGames().catch(() => []);
  const featured = games.slice(0, 3);

  const pillars = [
    {
      title: t('home.pillars.play.title'),
      description: t('home.pillars.play.description'),
      color: 'from-play to-amber-300',
    },
    {
      title: t('home.pillars.learn.title'),
      description: t('home.pillars.learn.description'),
      color: 'from-learn to-emerald-300',
    },
    {
      title: t('home.pillars.protect.title'),
      description: t('home.pillars.protect.description'),
      color: 'from-protect to-rose-300',
    },
  ];

  return (
    <div className="space-y-14">
      <section className="grid gap-8 rounded-[32px] bg-white/90 p-8 shadow-xl shadow-brand-900/5 md:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            {t('home.tagline')}
          </p>
          <h1 className="font-display text-4xl leading-tight text-midnight md:text-5xl">
            {t('home.title')}
          </h1>
          <p className="text-lg text-slate-600">
            {t('home.description')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/auth/sign-up">{t('common.getStarted')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="#pillars">{t('common.explorePillars')}</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-500">
            <div>
              <p className="text-2xl font-bold text-brand-600">3</p>
              <p>{t('home.stats.ageGroups')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">4</p>
              <p>{t('home.stats.userRoles')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">24/7</p>
              <p>{t('home.stats.digitalSafety')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] bg-gradient-to-b from-brand-100 to-white p-6">
          <p className="text-sm font-semibold text-brand-700">{t('home.whatsInside')}</p>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>• {t('home.feature1')}</li>
            <li>• {t('home.feature2')}</li>
            <li>• {t('home.feature3')}</li>
            <li>• {t('home.feature4')}</li>
          </ul>
          <div className="mt-6 rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700">{t('home.nowPiloting')}</p>
            <p className="text-slate-500">{t('home.pilotDescription')}</p>
          </div>
        </div>
      </section>

      <section id="pillars" className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-3">
            <div className={`inline-flex rounded-full bg-gradient-to-r ${pillar.color} px-4 py-1 text-sm font-semibold text-white`}>
              {pillar.title}
            </div>
            <p className="text-slate-600">{pillar.description}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-midnight">{t('home.featuredGames')}</h2>
            <p className="text-sm text-slate-500">{t('home.featuredGamesDescription')}</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/games">{t('home.seeAllGames')}</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((game) => (
            <Card key={game.id} className="space-y-3">
              <p className="text-xs font-semibold uppercase text-brand-500">{game.subject}</p>
              <h3 className="font-semibold text-xl text-midnight">{game.title}</h3>
              <p className="text-sm text-slate-500">{game.description}</p>
              <p className="text-xs text-slate-500">
                Ages {game.min_age_group.replace('_', '-')} to {game.max_age_group.replace('_', '-')} · {game.estimated_duration_minutes} min
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/games/${game.slug}`}>{t('common.playNow')}</Link>
              </Button>
            </Card>
          ))}
          {!featured.length && (
            <Card className="md:col-span-3 text-center text-slate-500">
              <p>Games will appear here once the backend is connected to Supabase.</p>
            </Card>
          )}
        </div>
      </section>

      <section className="rounded-[32px] bg-midnight p-8 text-white">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-brand-200">{t('home.digitalSafety.title')}</p>
            <h2 className="font-display text-3xl">{t('home.digitalSafety.subtitle')}</h2>
            <p className="text-slate-900">
              {t('home.digitalSafety.description')}
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-900">
            <p>{t('home.digitalSafety.feature1')}</p>
            <p>{t('home.digitalSafety.feature2')}</p>
            <p>{t('home.digitalSafety.feature3')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
