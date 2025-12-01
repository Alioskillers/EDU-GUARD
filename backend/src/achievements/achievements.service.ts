import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AchievementsService {
  constructor(private readonly db: DatabaseService) {}

  async listAll() {
    const result = await this.db.query(
      'SELECT * FROM achievements ORDER BY points DESC',
    );
    return result.rows;
  }

  async listForChild(childId: string) {
    const result = await this.db.query(
      `SELECT ca.*, a.name, a.description, a.points
       FROM child_achievements ca
       JOIN achievements a ON a.id = ca.achievement_id
       WHERE ca.child_id = $1
       ORDER BY ca.awarded_at DESC`,
      [childId],
    );

    return result.rows;
  }

  async getChildPoints(childId: string) {
    // Get points from achievements
    const achievementPoints = await this.db.query(
      `SELECT COALESCE(SUM(a.points), 0) as points
       FROM child_achievements ca
       JOIN achievements a ON a.id = ca.achievement_id
       WHERE ca.child_id = $1`,
      [childId],
    );

    // Get points from completed game sessions (score is stored in gameplay_sessions)
    const sessionPoints = await this.db.query(
      `SELECT COALESCE(SUM(score), 0) as points
       FROM gameplay_sessions
       WHERE child_id = $1 AND completed = true AND score IS NOT NULL`,
      [childId],
    );

    const achievementTotal = Number(achievementPoints.rows[0]?.points ?? 0);
    const sessionTotal = Number(sessionPoints.rows[0]?.points ?? 0);

    return achievementTotal + sessionTotal;
  }

  async awardAchievement(childId: string, achievementId: string) {
    await this.db.query(
      `INSERT INTO child_achievements (child_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT (child_id, achievement_id) DO NOTHING`,
      [childId, achievementId],
    );

    return this.listForChild(childId);
  }

  async awardByCode(childId: string, code: string) {
    const achievement = await this.db.query(
      `SELECT id FROM achievements WHERE code = $1`,
      [code],
    );
    if (!achievement.rowCount) {
      return;
    }

    await this.db.query(
      `INSERT INTO child_achievements (child_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT (child_id, achievement_id) DO NOTHING`,
      [childId, achievement.rows[0].id],
    );
  }

  async evaluateSessionResults(session: any) {
    if (!session.child_id) {
      return;
    }

    // Check if this is their first completed session
    const firstPlayCheck = await this.db.query(
      `SELECT COUNT(*) as count
       FROM gameplay_sessions
       WHERE child_id = $1 AND completed = true`,
      [session.child_id],
    );

    const completedCount = Number(firstPlayCheck.rows[0].count);

    // Award FIRST_PLAY achievement if this is their first completed session
    if (completedCount === 1) {
      await this.awardByCode(session.child_id, 'FIRST_PLAY');
    }

    // Award HIGH_SCORE achievement if score is 80 or higher
    if (session.score && session.score >= 80) {
      await this.awardByCode(session.child_id, 'HIGH_SCORE');
    }

    // Award FOCUS_HERO achievement if they've completed 5 sessions
    if (completedCount >= 5) {
      await this.awardByCode(session.child_id, 'FOCUS_HERO');
    }
  }
}
