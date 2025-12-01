export type Database = {
  public: Record<string, never>;
};

export type ApiUser = {
  id: string;
  role: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN';
  full_name: string;
  email: string;
  child_profile?: {
    id: string;
    display_name: string;
    age: number;
    age_group: '3_5' | '6_8' | '9_12';
    avatar_url?: string | null;
    guardian_code?: string;
  } | null;
  children?: Array<{
    id: string;
    display_name: string;
    age: number;
    age_group: string;
    relationship?: string;
  }>;
};

export type Game = {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  min_age_group: string;
  max_age_group: string;
  estimated_duration_minutes: number;
};

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  points: number;
  awarded_at?: string;
};

export type GameplaySession = {
  id: string;
  game_id: string;
  title?: string;
  game_slug?: string;
  started_at: string;
  ended_at?: string;
  completed: boolean;
  score?: number;
};

export type MonitoringSummary = {
  total_minutes: number;
  by_day: { day: string; minutes: number }[];
  by_type: { content_type: string; minutes: number }[];
};

export type Alert = {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  generated_at: string;
  resolved: boolean;
};

export type LeaderboardEntry = {
  id: string;
  display_name: string;
  age_group: string;
  points: number;
};
