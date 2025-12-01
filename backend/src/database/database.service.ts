import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('SUPABASE_DB_URL');

    if (!connectionString) {
      throw new Error(
        'SUPABASE_DB_URL is not set. Please check your .env file. ' +
          'Get the connection string from: Supabase Dashboard > Project Settings > Database > Connection string (URI)',
      );
    }

    // Validate connection string format
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      throw new Error(
        'SUPABASE_DB_URL must start with postgresql:// or postgres://. ' +
          'Get the correct format from: Supabase Dashboard > Project Settings > Database',
      );
    }

    this.pool = new Pool({
      connectionString,
      // Add connection timeout and retry logic
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
    });

    // Handle connection errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  async query<T = unknown>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  // NFR-11: Get client for transactions (data integrity)
  async getClient() {
    return this.pool.connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
