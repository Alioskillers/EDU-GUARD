import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly db: DatabaseService) {}

  async getLeaderboard(ageGroup?: string) {
    const params: any[] = [];
    const where = ageGroup ? `WHERE c.age_group = $1` : '';
    if (ageGroup) {
      params.push(ageGroup);
    }

    const result = await this.db.query(
      `SELECT 
         c.id, 
         c.display_name, 
         c.age_group,
         COALESCE(SUM(a.points), 0) + COALESCE(SUM(s.score), 0) as points
       FROM children c
       LEFT JOIN child_achievements ca ON ca.child_id = c.id
       LEFT JOIN achievements a ON a.id = ca.achievement_id
       LEFT JOIN gameplay_sessions s ON s.child_id = c.id AND s.completed = true AND s.score IS NOT NULL
       ${where}
       GROUP BY c.id
       ORDER BY points DESC
       LIMIT 20`,
      params,
    );

    return result.rows;
  }
}
