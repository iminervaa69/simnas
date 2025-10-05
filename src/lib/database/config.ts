/**
 * Database Configuration Utility
 * Handles switching between local and online PostgreSQL connections
 */

export type DatabaseMode = 'local' | 'online'

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl: boolean | {
    rejectUnauthorized: boolean
  }
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey: string
}

/**
 * Get the current database mode from environment variables
 */
export function getDatabaseMode(): DatabaseMode {
  const mode = process.env.DB_MODE?.toLowerCase()
  if (mode === 'local' || mode === 'online') {
    return mode
  }
  
  // Default to local if not specified
  console.warn('DB_MODE not specified, defaulting to local')
  return 'local'
}

/**
 * Get local PostgreSQL configuration
 */
export function getLocalDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.LOCAL_DB_HOST || 'localhost',
    port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
    database: process.env.LOCAL_DB_NAME || 'simmas',
    user: process.env.LOCAL_DB_USER || 'postgres',
    password: String(process.env.LOCAL_DB_PASSWORD || ''), // Ensure it's always a string
    ssl: false  // Disable SSL for local PostgreSQL
  }
}

/**
 * Get online/remote PostgreSQL configuration
 */
export function getOnlineDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '6543'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || '',
    password: String(process.env.DB_PASSWORD || ''), // Ensure it's always a string
    ssl: {
      rejectUnauthorized: false
    }
  }
}

/**
 * Get direct connection configuration (fallback)
 */
export function getDirectDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_DIRECT_HOST || '',
    port: parseInt(process.env.DB_DIRECT_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_DIRECT_USER || 'postgres',
    password: String(process.env.SUPABASE_PASSWORD || ''), // Ensure it's always a string
    ssl: {
      rejectUnauthorized: false
    }
  }
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }
}

/**
 * Get the appropriate database configuration based on current mode
 */
export function getCurrentDatabaseConfig(): DatabaseConfig {
  const mode = getDatabaseMode()
  
  if (mode === 'local') {
    return getLocalDatabaseConfig()
  } else {
    return getOnlineDatabaseConfig()
  }
}

/**
 * Generate DATABASE_URL for Prisma based on current mode
 */
export function getDatabaseUrl(): string {
  const mode = getDatabaseMode()
  
  if (mode === 'local') {
    const config = getLocalDatabaseConfig()
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
  } else {
    const config = getOnlineDatabaseConfig()
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
  }
}

/**
 * Generate DIRECT_URL for Prisma based on current mode
 */
export function getDirectUrl(): string {
  const mode = getDatabaseMode()
  
  if (mode === 'local') {
    const config = getLocalDatabaseConfig()
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
  } else {
    const config = getDirectDatabaseConfig()
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
  }
}

/**
 * Check if we're in local mode
 */
export function isLocalMode(): boolean {
  return getDatabaseMode() === 'local'
}

/**
 * Check if we're in online mode
 */
export function isOnlineMode(): boolean {
  return getDatabaseMode() === 'online'
}

/**
 * Log current database configuration (without sensitive data)
 */
export function logDatabaseConfig(): void {
  const mode = getDatabaseMode()
  const config = getCurrentDatabaseConfig()
  
  console.log(`🗄️  Database Mode: ${mode.toUpperCase()}`)
  console.log(`📍 Host: ${config.host}:${config.port}`)
  console.log(`📊 Database: ${config.database}`)
  console.log(`👤 User: ${config.user}`)
  console.log(`🔒 SSL: ${typeof config.ssl === 'object' ? (config.ssl.rejectUnauthorized ? 'enabled' : 'disabled') : (config.ssl ? 'enabled' : 'disabled')}`)
}
