import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCreationDto } from './dto/create-creation.dto';
import { ContentFilterService } from '../common/services/content-filter.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class CreativeService {
  constructor(
    private readonly db: DatabaseService,
    private readonly contentFilter: ContentFilterService,
    private readonly alertsService: AlertsService,
  ) {}

  async createCreation(dto: CreateCreationDto) {
    // Check for inappropriate content in both title and content
    const filterResult = this.contentFilter.checkTitleAndContent(dto.title, dto.content);

    if (filterResult.isInappropriate) {
      // Create alert for parent about inappropriate content attempt
      try {
        const alert = await this.alertsService.createAlert(
          dto.child_id,
          'INAPPROPRIATE_CONTENT',
          'HIGH',
          `Your child attempted to save content containing inappropriate words: ${filterResult.detectedWords.join(', ')}. The content was blocked.`,
        );
        console.log('Alert created for inappropriate content:', {
          alertId: alert.id,
          childId: dto.child_id,
          detectedWords: filterResult.detectedWords,
        });
      } catch (alertError) {
        // Log error but don't fail the request - the content is still blocked
        console.error('Failed to create alert for inappropriate content:', alertError);
      }

      // Throw error to prevent saving with a friendly message
      throw new BadRequestException(
        `Your content contains words that are not allowed. Please use kind and appropriate language.`,
      );
    }

    // Content is safe, proceed with saving
    const result = await this.db.query(
      `INSERT INTO creations (child_id, title, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.child_id, dto.title, dto.type, dto.content],
    );

    return result.rows[0];
  }

  async listCreations(childId: string) {
    const result = await this.db.query(
      `SELECT * FROM creations
       WHERE child_id = $1
       ORDER BY created_at DESC`,
      [childId],
    );

    return result.rows;
  }
}

