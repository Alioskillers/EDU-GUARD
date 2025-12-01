import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filters: Record<string, string | undefined>) {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (filters.subject) {
      params.push(filters.subject);
      conditions.push(`subject = $${params.length}`);
    }

    if (filters.age_group) {
      const minParamIndex = params.length + 1;
      const maxParamIndex = params.length + 2;
      params.push(filters.age_group, filters.age_group);
      conditions.push(
        `min_age_group <= $${minParamIndex} AND max_age_group >= $${maxParamIndex}`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    const result = await this.db.query(
      `SELECT * FROM games ${whereClause} ORDER BY created_at DESC`,
      params,
    );
    return result.rows;
  }

  async findBySlug(slug: string) {
    const result = await this.db.query(`SELECT * FROM games WHERE slug = $1`, [
      slug,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Game not found');
    }

    return result.rows[0];
  }

  async create(createDto: CreateGameDto, createdBy: string) {
    const result = await this.db.query(
      `INSERT INTO games (title, slug, description, subject, min_age_group, max_age_group, estimated_duration_minutes, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8, true), $9)
       RETURNING *`,
      [
        createDto.title,
        createDto.slug,
        createDto.description,
        createDto.subject,
        createDto.min_age_group,
        createDto.max_age_group,
        createDto.estimated_duration_minutes,
        createDto.is_active,
        createdBy,
      ],
    );

    return result.rows[0];
  }

  async update(id: string, dto: UpdateGameDto) {
    const fields = Object.entries(dto);
    if (!fields.length) {
      return this.findById(id);
    }

    const sets = fields.map(([key], index) => `${key} = $${index + 1}`);
    const values = fields.map(([, value]) => value);
    values.push(id);

    const result = await this.db.query(
      `UPDATE games SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );

    if (!result.rowCount) {
      throw new NotFoundException('Game not found');
    }

    return result.rows[0];
  }

  async findById(id: string) {
    const result = await this.db.query(`SELECT * FROM games WHERE id = $1`, [
      id,
    ]);
    if (!result.rowCount) {
      throw new NotFoundException('Game not found');
    }

    return result.rows[0];
  }
}
