import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async createSession(dto: CreateSessionDto) {
    const result = await this.db.query(
      `INSERT INTO gameplay_sessions (child_id, game_id, started_at, completed)
       VALUES ($1, $2, NOW(), false)
       RETURNING *`,
      [dto.child_id, dto.game_id],
    );

    return result.rows[0];
  }

  async completeSession(id: string, dto: CompleteSessionDto) {
    const metadataPayload = dto.metadata ? JSON.stringify(dto.metadata) : null;

    const result = await this.db.query(
      `UPDATE gameplay_sessions
       SET ended_at = NOW(), completed = $1, score = $2, metadata = COALESCE($3, metadata)
       WHERE id = $4
       RETURNING *`,
      [dto.completed, dto.score ?? null, metadataPayload, id],
    );

    if (!result.rowCount) {
      throw new NotFoundException('Session not found');
    }

    const session = result.rows[0];
    await this.achievementsService.evaluateSessionResults(session);
    return session;
  }

  async listSessionsForChild(childId: string, limit = 20) {
    const result = await this.db.query(
      `SELECT s.*, g.title, g.slug
       FROM gameplay_sessions s
       JOIN games g ON g.id = s.game_id
       WHERE s.child_id = $1
       ORDER BY s.started_at DESC
       LIMIT $2`,
      [childId, limit],
    );

    return result.rows;
  }
}
