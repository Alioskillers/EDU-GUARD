'use client';

import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ContentFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function ContentFilterModal({ isOpen, onClose, message }: ContentFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md space-y-6 p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <span className="text-4xl">🤔</span>
          </div>
          <h2 className="font-display text-2xl text-midnight">Oops! Let's Try Again</h2>
        </div>

        <div className="space-y-3 rounded-2xl bg-amber-50 p-4">
          <p className="text-center text-sm font-semibold text-amber-800">
            We noticed some words that aren't quite right for our creative space.
          </p>
          <p className="text-center text-sm text-amber-700">
            {message || 'Please use kind and friendly words that make everyone feel happy and safe!'}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-center text-xs text-blue-700">
            💡 <strong>Tip:</strong> Try using positive words like "amazing", "wonderful", or "awesome" instead!
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-center text-xs text-slate-600">
            Your parent has been notified to help keep our space safe and friendly for everyone.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Got it! I'll use kind words ✨
        </Button>
      </Card>
    </div>
  );
}

