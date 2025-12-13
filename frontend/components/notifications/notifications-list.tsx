'use client';

import { useState, useEffect } from 'react';
import { authedClientFetch } from '../../lib/client-api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  generated_at: string;
  resolved: boolean;
  resolved_at?: string;
}

interface Props {
  childId: string | null;
  role?: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN';
}

export function NotificationsList({ childId, role }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [childId]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      if (childId) {
        const data = await authedClientFetch(`/alerts/children/${childId}`) as Alert[];
        setAlerts(data);
      } else if (role === 'TEACHER' || role === 'ADMIN') {
        // For teachers/admins, we'd need a different endpoint for aggregated alerts
        // For now, show empty or implement aggregated endpoint
        setAlerts([]);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await authedClientFetch(`/alerts/${alertId}/resolve`, {
        method: 'PATCH',
      });
      await loadAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes('SCREEN_TIME')) return '⏰';
    if (type.includes('CYBERBULLYING')) return '🛡️';
    if (type.includes('INAPPROPRIATE')) return '⚠️';
    return '📢';
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading alerts...</p>;
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No alerts at this time. 🎉</p>
      </div>
    );
  }

  const unresolved = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-4">
      {unresolved.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Active Alerts ({unresolved.length})</h3>
          {unresolved.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border-2 p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getAlertIcon(alert.alert_type)}</span>
                    <span className="text-xs font-semibold uppercase">
                      {alert.alert_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{alert.message}</p>
                  <p className="text-xs opacity-75">
                    {new Date(alert.generated_at).toLocaleString()}
                  </p>
                </div>
                {role !== 'CHILD' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    className="text-xs"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-semibold text-slate-500">Resolved Alerts ({resolved.length})</h3>
          {resolved.map((alert) => (
            <div
              key={alert.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-60"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getAlertIcon(alert.alert_type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-600">
                      {alert.alert_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">✓ Resolved</span>
                  </div>
                  <p className="text-sm text-slate-600">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(alert.generated_at).toLocaleString()}
                    {alert.resolved_at && ` · Resolved ${new Date(alert.resolved_at).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

