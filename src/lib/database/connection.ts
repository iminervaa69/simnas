import { Pool, Client, QueryResult } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: {
    rejectUnauthorized: boolean;
    servername?: string;
  };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    console.log('Creating new pool with config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      ssl: dbConfig.ssl,
      password: '***hidden***'
    });
    
    pool = new Pool(dbConfig);
    
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
    
    pool.on('connect', (client) => {
      console.log('✅ Connected to database via pool');
    });
  }
  
  return pool;
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error: any) {
    console.error('Query error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export async function initRefreshTokensTable(): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      revoked_at TIMESTAMPTZ,
      device_info VARCHAR,
      ip_address INET
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
  `;
  
  try {
    await query(createTableQuery);
    console.log('✅ Refresh tokens table initialized');
  } catch (error) {
    console.error('❌ Failed to initialize refresh tokens table:', error);
    throw error;
  }
}