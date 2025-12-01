import { env } from './env';
import { Achievement, Alert, ApiUser, Game, GameplaySession, MonitoringSummary, LeaderboardEntry } from './types';
import { getServerSession } from './supabase-server';

async function authedFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  // Get session token from server-side if not provided
  let accessToken = token;
  if (!accessToken) {
    try {
      const session = await getServerSession();
      accessToken = session?.access_token ?? null;
      
      if (!accessToken) {
        console.warn('No access token available for request to:', path);
      }
    } catch (error) {
      // If we can't get session server-side, token remains null
      console.error('Error getting server session:', error);
      accessToken = null;
    }
  }

  if (!accessToken) {
    throw new Error('Not authenticated - no access token available');
  }

  headers.set('Authorization', `Bearer ${accessToken}`);

  try {
    const response = await fetch(`${env.apiBase}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      const errorText = await response.text().catch(() => '');
      throw new Error(`API error: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error(`Unable to connect to backend at ${env.apiBase}. Please ensure the backend is running on port 4000.`);
    }
    throw error;
  }
}

export async function fetchProfile(): Promise<ApiUser> {
  return authedFetch<ApiUser>('/me');
}

export async function fetchGames(params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const suffix = search.size ? `?${search.toString()}` : '';
  const response = await fetch(`${env.apiBase}/games${suffix}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load games');
  }
  return (await response.json()) as Game[];
}

export async function fetchGame(slug: string) {
  if (!slug) {
    throw new Error('Game slug is required');
  }
  
  const response = await fetch(`${env.apiBase}/games/${slug}`, { cache: 'no-store' });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Game with slug "${slug}" not found`);
    }
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to fetch game: ${errorText || response.statusText}`);
  }
  
  return (await response.json()) as Game;
}

export async function fetchChildSessions(childId: string) {
  return authedFetch<GameplaySession[]>(`/children/${childId}/sessions`);
}

export async function fetchChildAchievements(childId: string) {
  return authedFetch<Achievement[]>(`/achievements/children/${childId}`);
}

export async function fetchChildTotalPoints(childId: string): Promise<number> {
  const result = await authedFetch<{ total_points: number }>(`/achievements/children/${childId}/points`);
  return result.total_points;
}

export async function fetchAchievements() {
  return authedFetch<Achievement[]>('/achievements');
}

export async function fetchLeaderboard(ageGroup?: string) {
  const suffix = ageGroup ? `?age_group=${ageGroup}` : '';
  return authedFetch<LeaderboardEntry[]>(`/leaderboard${suffix}`);
}

export async function fetchMonitoringSummary(childId: string) {
  return authedFetch<MonitoringSummary>(`/children/${childId}/monitoring/summary`);
}

export async function fetchAlerts(childId: string) {
  return authedFetch<Alert[]>(`/alerts/children/${childId}`);
}

export async function resolveAlert(alertId: string) {
  return authedFetch<Alert>(`/alerts/${alertId}/resolve`, { method: 'PATCH' });
}
