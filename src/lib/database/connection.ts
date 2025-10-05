import { createClient } from '@supabase/supabase-js'
import { 
  getDatabaseMode, 
  getSupabaseConfig, 
  isOnlineMode,
  logDatabaseConfig 
} from './config'

// Initialize Supabase clients only when in online mode
let supabase: any = null
let supabaseAdmin: any = null

if (isOnlineMode()) {
  const config = getSupabaseConfig()
  if (config.url && config.anonKey) {
    supabase = createClient(config.url, config.anonKey)
    
    if (config.serviceRoleKey) {
      supabaseAdmin = createClient(config.url, config.serviceRoleKey)
    }
  }
}

export { supabase, supabaseAdmin }

// Example usage (only works in online mode)
export async function getUsers() {
  if (!isOnlineMode() || !supabase) {
    throw new Error('Supabase client is only available in online mode')
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }
  
  return data
}

// Method 2: Direct PostgreSQL connection using dynamic configuration
// Install: npm install pg @types/pg

import { Pool, QueryResult } from 'pg'
import { 
  getCurrentDatabaseConfig, 
  getDirectDatabaseConfig,
  DatabaseConfig 
} from './config'

let pool: Pool

function getPool(useDirectConnection = false): Pool {
  if (!pool) {
    const config = useDirectConnection ? getDirectDatabaseConfig() : getCurrentDatabaseConfig()
    const mode = getDatabaseMode()
    
    console.log(`Creating ${mode} pool connection to:`, {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: '***hidden***',
      mode: mode
    })
    
    pool = new Pool({
      ...config,
      ssl: config.ssl, // Use the SSL config directly (boolean or object)
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    
    pool.on('error', (err: Error) => {
      console.error('Database pool error:', err)
    })
    
    pool.on('connect', () => {
      console.log(`✅ Connected to ${mode} database via pool`)
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
  const mode = getDatabaseMode()
  console.log(`🧪 Testing ${mode} database connection...`)
  
  try {
    // First try pooled connection
    console.log('Testing pooled connection...')
    const result = await query('SELECT NOW() as current_time, version() as db_version')
    console.log(`✅ ${mode} database connected successfully via pooled connection!`)
    console.log('Current time:', result.rows[0].current_time)
    console.log('Database version:', result.rows[0].db_version)
    return true
  } catch (error: any) {
    console.error(`❌ ${mode} pooled connection failed:`, error.message)
    
    // Only try direct connection fallback in online mode
    if (mode === 'online') {
      try {
        console.log('Testing direct connection fallback...')
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
    
    return false
  }
}

// Method 3: Using DATABASE_URL connection string (Alternative approach)
import { Pool as URLPool } from 'pg'
import { getDatabaseUrl } from './config'

let urlPool: URLPool

function getURLPool(): URLPool {
  if (!urlPool) {
    const databaseUrl = getDatabaseUrl()
    const mode = getDatabaseMode()
    console.log(`Creating ${mode} connection using DATABASE_URL...`)
    
    urlPool = new URLPool({
      connectionString: databaseUrl,
      ssl: mode === 'local' ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    
    urlPool.on('error', (err: Error) => {
      console.error('URL Pool error:', err)
    })
    
    urlPool.on('connect', () => {
      console.log(`✅ Connected via DATABASE_URL (${mode} mode)`)
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
  const mode = getDatabaseMode()
  console.log(`🧪 Testing all connection methods for ${mode} mode...\n`)
  
  // Log current configuration
  logDatabaseConfig()
  console.log('')
  
  // Test 1: Supabase Client (only in online mode)
  if (mode === 'online') {
    try {
      console.log('1. Testing Supabase Client...')
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (error) throw error
      console.log('✅ Supabase Client: Working\n')
    } catch (error: any) {
      console.error('❌ Supabase Client: Failed -', error.message, '\n')
    }
  } else {
    console.log('1. Supabase Client: Skipped (local mode)\n')
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