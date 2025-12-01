'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';

interface Props {
  alertId: string;
  onResolved?: () => void;
}

export function ResolveAlertButton({ alertId, onResolved }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className="text-xs"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await authedClientFetch(`/alerts/${alertId}/resolve`, { method: 'PATCH' });
        setLoading(false);
        onResolved?.();
        router.refresh();
      }}
    >
      {loading ? 'Saving…' : 'Mark as understood'}
    </Button>
  );
}
