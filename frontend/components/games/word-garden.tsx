'use client';

import { useState } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';

const vocabulary = [
  { word: 'curious', options: ['Full of questions', 'Very tired', 'Super fast'], answer: 'Full of questions' },
  { word: 'brave', options: ['Feeling shy', 'Showing courage', 'Wanting a snack'], answer: 'Showing courage' },
  { word: 'sparkle', options: ['To shine brightly', 'To whisper', 'To count backwards'], answer: 'To shine brightly' },
];

interface Props {
  childId: string;
  gameId: string;
}

export function WordGarden({ childId, gameId }: Props) {
  const [index, setIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle');

  const start = async () => {
    const session = await authedClientFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, game_id: gameId }),
    });
    setSessionId(session.id);
    setStatus('playing');
  };

  const selectOption = async (choice: string) => {
    const current = vocabulary[index];
    const answeredCorrectly = choice === current.answer;
    const nextScore = answeredCorrectly ? score + 1 : score;
    setScore(nextScore);

    if (index + 1 >= vocabulary.length && sessionId) {
      setStatus('finished');
      await authedClientFetch(`/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: true, score: nextScore * 25, metadata: { words: vocabulary.length } }),
      });
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  if (status === 'idle') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Match each word with the meaning.</p>
        <Button onClick={start}>Start Word Garden</Button>
      </div>
    );
  }

  if (status === 'finished') {
    return <p className="text-sm font-semibold text-emerald-600">Lovely! Your new words have been saved.</p>;
  }

  const current = vocabulary[index];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Word {index + 1} of {vocabulary.length}</p>
      <p className="text-4xl font-display text-brand-600">{current.word}</p>
      <div className="space-y-2">
        {current.options.map((option) => (
          <button
            key={option}
            onClick={() => selectOption(option)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-slate-900 hover:border-brand-400"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
