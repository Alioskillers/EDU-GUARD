import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateContentEventDto } from './dto/create-content-event.dto';
import { CompleteContentEventDto } from './dto/complete-content-event.dto';
import { AlertsService } from '../alerts/alerts.service';

const RISKY_WORDS = ['hate', 'stupid', 'loser', 'bully', 'hurt'];
const SCREEN_TIME_LIMIT_MINUTES = 120;

@Injectable()
export class MonitoringService {
  constructor(
    private readonly db: DatabaseService,
    private readonly alertsService: AlertsService,
  ) {}

  async createContentEvent(dto: CreateContentEventDto) {
    const result = await this.db.query(
      `INSERT INTO content_events (child_id, content_type, reference_id, started_at, raw_text, labels)
       VALUES ($1, $2, $3, NOW(), $4, $5)
       RETURNING *`,
      [
        dto.child_id,
        dto.content_type,
        dto.reference_id,
        dto.raw_text ?? null,
        dto.labels ?? null,
      ],
    );

    if (dto.raw_text) {
      await this.scanText(dto.child_id, dto.raw_text);
    }

    return result.rows[0];
  }

  async completeContentEvent(id: string, dto: CompleteContentEventDto) {
    const result = await this.db.query(
      `UPDATE content_events
       SET ended_at = NOW(), raw_text = COALESCE($1, raw_text)
       WHERE id = $2
       RETURNING *`,
      [dto.raw_text ?? null, id],
    );

    if (!result.rowCount) {
      return null;
    }

    const event = result.rows[0];
    if (dto.raw_text) {
      await this.scanText(event.child_id, dto.raw_text);
    }

    await this.checkScreenTime(event.child_id);
    return event;
  }

  async getSummary(childId: string) {
    const totals = await this.db.query(
      `SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM COALESCE(ended_at, NOW()) - started_at)) / 60, 0) as total_minutes
       FROM content_events
       WHERE child_id = $1 AND started_at >= NOW() - INTERVAL '7 days'`,
      [childId],
    );

    const byDay = await this.db.query(
      `SELECT
        DATE(started_at) as day,
        COALESCE(SUM(EXTRACT(EPOCH FROM COALESCE(ended_at, NOW()) - started_at)) / 60, 0) as minutes
       FROM content_events
       WHERE child_id = $1 AND started_at >= NOW() - INTERVAL '7 days'
       GROUP BY day
       ORDER BY day`,
      [childId],
    );

    const byType = await this.db.query(
      `SELECT
        content_type,
        COALESCE(SUM(EXTRACT(EPOCH FROM COALESCE(ended_at, NOW()) - started_at)) / 60, 0) as minutes
       FROM content_events
       WHERE child_id = $1 AND started_at >= NOW() - INTERVAL '7 days'
       GROUP BY content_type`,
      [childId],
    );

    return {
      total_minutes: Number(totals.rows[0]?.total_minutes ?? 0),
      by_day: byDay.rows,
      by_type: byType.rows,
    };
  }

  private async scanText(childId: string, text: string) {
    const normalized = text.toLowerCase();
    const flagged = RISKY_WORDS.some((word) => normalized.includes(word));

    if (flagged) {
      await this.alertsService.createAlert(
        childId,
        'POTENTIAL_CYBERBULLYING',
        'MEDIUM',
        'We spotted some hurtful words. Take a moment to talk about kind language.',
      );
    }
  }

  private async checkScreenTime(childId: string) {
    const total = await this.db.query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM COALESCE(ended_at, NOW()) - started_at)) / 60, 0) as minutes
       FROM content_events
       WHERE child_id = $1 AND started_at >= NOW() - INTERVAL '24 hours'`,
      [childId],
    );

    if (Number(total.rows[0]?.minutes ?? 0) > SCREEN_TIME_LIMIT_MINUTES) {
      await this.alertsService.createAlert(
        childId,
        'SCREEN_TIME',
        'LOW',
        'Lots of fun today! Consider a movement break to stay balanced.',
      );
    }
  }
}
