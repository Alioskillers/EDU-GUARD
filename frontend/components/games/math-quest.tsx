'use client';

import { useState } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';

interface Props {
  gameId: string;
  childId: string;
}

function createQuestion(difficulty: number) {
  const a = Math.ceil(Math.random() * difficulty * 5);
  const b = Math.ceil(Math.random() * difficulty * 5);
  return { prompt: `${a} + ${b}`, answer: a + b };
}

export function MathQuest({ gameId, childId }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState(() => createQuestion(2));
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle');

  const startSession = async () => {
    const session = await authedClientFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, game_id: gameId }),
    });
    setSessionId(session.id);
    setStatus('playing');
  };

  const submitAnswer = async () => {
    if (!input.trim()) return;
    const answeredCorrectly = Number(input) === current.answer;
    const nextCorrect = answeredCorrectly ? correct + 1 : correct;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setCorrect(nextCorrect);
    setInput('');
    const nextDifficulty = Math.min(5, 1 + Math.floor(nextCorrect / 2));
    setCurrent(createQuestion(nextDifficulty));

    if (nextAttempts >= 5 && sessionId) {
      setStatus('finished');
      await authedClientFetch(`/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: true, score: nextCorrect * 20, metadata: { attempts: nextAttempts } }),
      });
    }
  };

  if (status === 'idle') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Solve quick math quests to earn coins.</p>
        <Button onClick={startSession}>Start quest</Button>
      </div>
    );
  }

  if (status === 'finished') {
    return <p className="text-sm font-semibold text-emerald-600">Brilliant! Your answers were sent to the stars.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Question #{attempts + 1}</p>
      <p className="text-4xl font-display text-midnight">{current.prompt}</p>
      <input
        type="number"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
        placeholder="Your answer"
      />
      <Button onClick={submitAnswer}>Submit</Button>
      <p className="text-xs text-slate-500">Correct answers: {correct}</p>
    </div>
  );
}
