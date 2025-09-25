// Method 1: Using Supabase Client (Recommended)
// First install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Example usage
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }
  
  return data
}

// Method 2: Direct PostgreSQL connection using your environment variables
// Install: npm install pg @types/pg

import { Pool, QueryResult } from 'pg'

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl: {
    rejectUnauthorized: boolean
  }
}

// Using your pooled connection (recommended for production)
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST!, // aws-1-ap-southeast-1.pooler.supabase.com
  port: parseInt(process.env.DB_PORT!), // 6543
  database: process.env.DB_NAME!, // postgres
  user: process.env.DB_USER!, // postgres.rqjvlgzfuzapvfnyzyvj
  password: process.env.DB_PASSWORD!, // YtRgkP8J8RNA&1Zb3u#&
  ssl: {
    rejectUnauthorized: false
  }
}

// Alternative: Direct connection fallback
const dbDirectConfig: DatabaseConfig = {
  host: process.env.DB_DIRECT_HOST!, // db.rqjvlgzfuzapvfnyzyvj.supabase.co
  port: parseInt(process.env.DB_DIRECT_PORT!), // 5432
  database: process.env.DB_NAME!, // postgres
  user: process.env.DB_DIRECT_USER!, // postgres
  password: process.env.SUPABASE_PASSWORD!, // YtRgkP8J8RNA&1Zb3u#&
  ssl: {
    rejectUnauthorized: false
  }
}

let pool: Pool

function getPool(useDirectConnection = false): Pool {
  if (!pool) {
    const config = useDirectConnection ? dbDirectConfig : dbConfig
    console.log('Creating pool connection to:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: '***hidden***'
    })
    
    pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    
    pool.on('error', (err: Error) => {
      console.error('Database pool error:', err)
    })
    
    pool.on('connect', () => {
      console.log('✅ Connected to Supabase database via pool')
    })
  }
  
  return pool
}

export async function query(text: string, params?: any[], useDirectConnection = false): Promise<QueryResult> {
  const pool = getPool(useDirectConnection)
  const start = Date.now()
  
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { 
      text: text.substring(0, 50), 
      duration, 
      rows: res.rowCount 
    })
    return res
  } catch (error: any) {
    console.error('Query error:', error.message)
    console.error('Full error:', error)
    
    // If pooled connection fails, try direct connection as fallback
    if (!useDirectConnection && error.code === 'ECONNREFUSED') {
      console.log('Pooled connection failed, trying direct connection...')
      return query(text, params, true)
    }
    
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    // First try pooled connection
    console.log('Testing pooled connection...')
    const result = await query('SELECT NOW() as current_time, version() as db_version')
    console.log('✅ Database connected successfully via pooled connection!')
    console.log('Current time:', result.rows[0].current_time)
    console.log('Database version:', result.rows[0].db_version)
    return true
  } catch (error: any) {
    console.error('❌ Pooled connection failed:', error.message)
    
    try {
      // Try direct connection as fallback
      console.log('Testing direct connection...')
      const result = await query('SELECT NOW() as current_time, version() as db_version', [], true)
      console.log('✅ Database connected successfully via direct connection!')
      console.log('Current time:', result.rows[0].current_time)
      console.log('Database version:', result.rows[0].db_version)
      return true
    } catch (directError: any) {
      console.error('❌ Direct connection also failed:', directError.message)
      return false
    }
  }
}

// Method 3: Using DATABASE_URL connection string (Alternative approach)
import { Pool as URLPool } from 'pg'

let urlPool: URLPool

function getURLPool(): URLPool {
  if (!urlPool) {
    console.log('Creating connection using DATABASE_URL...')
    
    urlPool = new URLPool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    
    urlPool.on('error', (err: Error) => {
      console.error('URL Pool error:', err)
    })
    
    urlPool.on('connect', () => {
      console.log('✅ Connected via DATABASE_URL')
    })
  }
  
  return urlPool
}

export async function queryWithURL(text: string, params?: any[]): Promise<QueryResult> {
  const pool = getURLPool()
  const start = Date.now()
  
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed URL query', { 
      text: text.substring(0, 50), 
      duration, 
      rows: res.rowCount 
    })
    return res
  } catch (error: any) {
    console.error('URL Query error:', error.message)
    throw error
  }
}

// Test all connection methods
export async function testAllConnections(): Promise<void> {
  console.log('🧪 Testing all connection methods...\n')
  
  // Test 1: Supabase Client
  try {
    console.log('1. Testing Supabase Client...')
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Supabase Client: Working\n')
  } catch (error: any) {
    console.error('❌ Supabase Client: Failed -', error.message, '\n')
  }
  
  // Test 2: Direct PostgreSQL
  try {
    console.log('2. Testing Direct PostgreSQL...')
    await testConnection()
    console.log('')
  } catch (error: any) {
    console.error('❌ Direct PostgreSQL: Failed -', error.message, '\n')
  }
  
  // Test 3: DATABASE_URL
  try {
    console.log('3. Testing DATABASE_URL connection...')
    const result = await queryWithURL('SELECT NOW() as current_time')
    console.log('✅ DATABASE_URL: Working')
    console.log('Current time:', result.rows[0].current_time, '\n')
  } catch (error: any) {
    console.error('❌ DATABASE_URL: Failed -', error.message, '\n')
  }
  
  console.log('🏁 Connection testing completed!')
}