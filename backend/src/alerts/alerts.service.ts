import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AlertsService {
  constructor(private readonly db: DatabaseService) {}

  async createAlert(
    childId: string,
    alertType: string,
    severity: string,
    message: string,
  ) {
    try {
      const result = await this.db.query(
        `INSERT INTO alerts (child_id, alert_type, severity, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [childId, alertType, severity, message],
      );
      console.log(`Alert created successfully for child ${childId}:`, {
        id: result.rows[0].id,
        type: alertType,
        severity,
      });
      return result.rows[0];
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  async listAlerts(childId: string) {
    const result = await this.db.query(
      `SELECT * FROM alerts WHERE child_id = $1 ORDER BY generated_at DESC`,
      [childId],
    );

    console.log(`Fetched ${result.rows.length} alerts for child ${childId}`);
    return result.rows;
  }

  async resolveAlert(id: string) {
    const result = await this.db.query(
      `UPDATE alerts SET resolved = true, resolved_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );

    return result.rows[0];
  }
}
