#!/usr/bin/env node

/**
 * Database Mode Switcher Script
 * Easily switch between local and online database modes
 */

const fs = require('fs')
const path = require('path')

const ENV_FILE = '.env.local'
const ENV_EXAMPLE_FILE = 'env.example'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const config = {}
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        config[key] = valueParts.join('=')
      }
    }
  })
  
  return config
}

function saveEnvFile(filePath, config) {
  const lines = Object.entries(config).map(([key, value]) => `${key}=${value}`)
  fs.writeFileSync(filePath, lines.join('\n') + '\n')
}

function generateDatabaseUrls(mode, config) {
  if (mode === 'local') {
    const host = config.LOCAL_DB_HOST || 'localhost'
    const port = config.LOCAL_DB_PORT || '5432'
    const database = config.LOCAL_DB_NAME || 'simmas'
    const user = config.LOCAL_DB_USER || 'postgres'
    const password = config.LOCAL_DB_PASSWORD || ''
    
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}`
    return { DATABASE_URL: url, DIRECT_URL: url }
  } else {
    const host = config.DB_HOST || ''
    const port = config.DB_PORT || '6543'
    const database = config.DB_NAME || 'postgres'
    const user = config.DB_USER || ''
    const password = config.DB_PASSWORD || ''
    
    const directHost = config.DB_DIRECT_HOST || ''
    const directPort = config.DB_DIRECT_PORT || '5432'
    const directUser = config.DB_DIRECT_USER || 'postgres'
    const directPassword = config.SUPABASE_PASSWORD || ''
    
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}`
    const directUrl = `postgresql://${directUser}:${directPassword}@${directHost}:${directPort}/${database}`
    
    return { DATABASE_URL: url, DIRECT_URL: directUrl }
  }
}

function switchToMode(mode) {
  console.log(`🔄 Switching to ${mode} database mode...`)
  
  // Load existing config
  const existingConfig = loadEnvFile(ENV_FILE)
  
  // Create new config
  const newConfig = {
    DB_MODE: mode,
    LOCAL_DB_HOST: existingConfig.LOCAL_DB_HOST || 'localhost',
    LOCAL_DB_PORT: existingConfig.LOCAL_DB_PORT || '5432',
    LOCAL_DB_NAME: existingConfig.LOCAL_DB_NAME || 'simmas',
    LOCAL_DB_USER: existingConfig.LOCAL_DB_USER || 'postgres',
    LOCAL_DB_PASSWORD: existingConfig.LOCAL_DB_PASSWORD || '',
    NEXT_PUBLIC_SUPABASE_URL: existingConfig.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: existingConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: existingConfig.SUPABASE_SERVICE_ROLE_KEY || '',
    DB_HOST: existingConfig.DB_HOST || '',
    DB_PORT: existingConfig.DB_PORT || '6543',
    DB_NAME: existingConfig.DB_NAME || 'postgres',
    DB_USER: existingConfig.DB_USER || '',
    DB_PASSWORD: existingConfig.DB_PASSWORD || '',
    DB_DIRECT_HOST: existingConfig.DB_DIRECT_HOST || '',
    DB_DIRECT_PORT: existingConfig.DB_DIRECT_PORT || '5432',
    DB_DIRECT_USER: existingConfig.DB_DIRECT_USER || 'postgres',
    SUPABASE_PASSWORD: existingConfig.SUPABASE_PASSWORD || '',
    DATABASE_URL: '',
    DIRECT_URL: ''
  }
  
  // Generate database URLs
  const urls = generateDatabaseUrls(mode, newConfig)
  newConfig.DATABASE_URL = urls.DATABASE_URL
  newConfig.DIRECT_URL = urls.DIRECT_URL
  
  // Save config
  saveEnvFile(ENV_FILE, newConfig)
  
  console.log(`✅ Switched to ${mode} mode`)
  console.log(`📊 Database URL: ${urls.DATABASE_URL}`)
  console.log(`🔗 Direct URL: ${urls.DIRECT_URL}`)
  
  if (mode === 'local') {
    console.log('\n📝 Make sure your local PostgreSQL is running and accessible!')
    console.log('   You can start it with: pg_ctl start')
  } else {
    console.log('\n📝 Make sure your Supabase/remote database credentials are correct!')
  }
}

function showStatus() {
  const config = loadEnvFile(ENV_FILE)
  const mode = config.DB_MODE || 'not set'
  
  console.log(`🗄️  Current database mode: ${mode}`)
  
  if (mode === 'local') {
    console.log(`📍 Local DB: ${config.LOCAL_DB_HOST}:${config.LOCAL_DB_PORT}/${config.LOCAL_DB_NAME}`)
  } else if (mode === 'online') {
    console.log(`🌐 Remote DB: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`)
  }
}

function showHelp() {
  console.log(`
🗄️  Database Mode Switcher

Usage:
  npm run db:local     - Switch to local PostgreSQL
  npm run db:online    - Switch to online/remote PostgreSQL  
  npm run db:status    - Show current database mode
  npm run db:help      - Show this help

Commands:
  local               Switch to local PostgreSQL mode
  online              Switch to online/remote PostgreSQL mode
  status              Show current database configuration
  help                Show this help message

Environment Files:
  .env.local          - Your actual environment variables
  env.example         - Example configuration file

Make sure to:
1. Copy env.example to .env.local
2. Fill in your database credentials
3. Run the appropriate switch command
`)
}

// Main execution
const command = process.argv[2]

switch (command) {
  case 'local':
    switchToMode('local')
    break
  case 'online':
    switchToMode('online')
    break
  case 'status':
    showStatus()
    break
  case 'help':
  case '--help':
  case '-h':
    showHelp()
    break
  default:
    console.log('❌ Unknown command. Use "help" to see available commands.')
    process.exit(1)
}
