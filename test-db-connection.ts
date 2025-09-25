import { Pool } from 'pg';

// Load environment variables (install: npm install dotenv)
try {
  require('dotenv').config();
} catch (error) {
  console.log('ℹ️  dotenv not found, using system environment variables');
}

// Supabase connection configuration
const supabaseConfig = {
  host: process.env.SUPABASE_HOST?.toString() || '',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_PASSWORD?.toString() || '',
  ssl: false, // Try without SSL first
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

let pool: Pool;

// Get or create connection pool
function getPool(): Pool {
  if (!pool) {
    console.log('🔄 Creating Supabase connection pool...');
    pool = new Pool(supabaseConfig);
    
    pool.on('error', (err) => {
      console.error('❌ Pool error:', err);
    });
    
    pool.on('connect', () => {
      console.log('✅ New client connected to Supabase');
    });
  }
  
  return pool;
}

// Simple query function
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  
  try {
    const result = await pool.query(text, params);
    console.log(`✅ Query executed successfully (${result.rowCount} rows)`);
    return result;
  } catch (error) {
    console.error('❌ Query failed:', error);
    throw error;
  }
}

// Test connection function with multiple SSL configurations
export async function testSupabaseConnection(): Promise<boolean> {
  const sslConfigs = [
    false, // No SSL
    { rejectUnauthorized: false }, // SSL without certificate validation
    { rejectUnauthorized: true }, // SSL with certificate validation
    'require', // Require SSL
  ];

  for (let i = 0; i < sslConfigs.length; i++) {
    const sslConfig = sslConfigs[i];
    console.log(`🔍 Testing connection attempt ${i + 1}/4 with SSL config:`, sslConfig);
    
    // Create a temporary config for this attempt
    const testConfig = { ...supabaseConfig, ssl: sslConfig };
    const testPool = new Pool(testConfig);
    
    try {
      const result = await testPool.query('SELECT NOW() as current_time, version() as pg_version');
      
      console.log('✅ Connection successful!');
      console.log('📊 Connection Details:');
      console.log('Current time:', result.rows[0].current_time);
      console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
      
      // Update the main pool with working config
      if (pool) await pool.end();
      pool = testPool;
      
      return true;
    } catch (error) {
      console.log(`❌ Attempt ${i + 1} failed:`, error.message);
      await testPool.end();
      
      if (i === sslConfigs.length - 1) {
        console.error('❌ All connection attempts failed');
        return false;
      }
    }
  }
  
  return false;
}

// Close pool (call this when shutting down your app)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('🔒 Connection pool closed');
  }
}

// Validate environment variables
function validateEnvVars(): boolean {
  console.log('🔍 Checking environment variables...');
  
  const host = process.env.SUPABASE_HOST;
  const password = process.env.SUPABASE_PASSWORD;
  
  // Check if variables exist and are strings
  if (!host || typeof host !== 'string') {
    console.error('❌ SUPABASE_HOST is missing or not a string');
    return false;
  }
  
  if (!password || typeof password !== 'string') {
    console.error('❌ SUPABASE_PASSWORD is missing or not a string');
    console.log('Current password type:', typeof password);
    console.log('Current password value:', password ? '[EXISTS]' : '[MISSING]');
    return false;
  }
  
  if (password.trim().length === 0) {
    console.error('❌ SUPABASE_PASSWORD is empty');
    return false;
  }
  
  console.log('✅ Environment variables validated');
  console.log('Host:', host);
  console.log('Password length:', password.length);
  console.log('Password starts with:', password.substring(0, 3) + '...');
  
  return true;
}

// Helper function to extract host from Supabase URL or project ID
function getCorrectSupabaseHost(): string {
  // If NEXT_PUBLIC_SUPABASE_URL exists, extract from there
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      // Extract project ID from URL like https://rqjvlgzfuzapvfnyzyvj.supabase.co
      const projectId = url.hostname.split('.')[0];
      return `db.${projectId}.supabase.co`;
    } catch (error) {
      console.log('Could not parse SUPABASE_URL:', error.message);
    }
  }
  
  // Fallback to manual host
  return process.env.SUPABASE_HOST || '';
}

// Example usage
async function main() {
  console.log('🚀 Starting Supabase connection test...');
  
  // Get the correct host
  const correctHost = getCorrectSupabaseHost();
  process.env.SUPABASE_HOST = correctHost;
  
  console.log('Environment check:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Determined SUPABASE_HOST:', correctHost);
  
  // Test different possible host formats
  const possibleHosts = [
    correctHost,
    correctHost.replace('db.', ''), // Without db prefix
    `aws-0-ap-southeast-1.pooler.supabase.com`, // Connection pooler (common)
    `db.rqjvlgzfuzapvfnyzyvj.supabase.co` // Your original
  ];
  
  console.log('\n🔍 Will test these host formats:');
  possibleHosts.forEach((host, i) => console.log(`${i + 1}. ${host}`));
  
  for (let i = 0; i < possibleHosts.length; i++) {
    console.log(`\n🔄 Testing host ${i + 1}: ${possibleHosts[i]}`);
    process.env.SUPABASE_HOST = possibleHosts[i];
    
    if (validateEnvVars()) {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        console.log(`🎉 Success! Use this host: ${possibleHosts[i]}`);
        return;
      }
    }
  }
  
  console.log('\n❌ All host formats failed. Please check:');
  console.log('1. Go to supabase.com/dashboard/project/rqjvlgzfuzapvfnyzyvj');
  console.log('2. Settings → Database');
  console.log('3. Look for "Connection parameters" section');
  console.log('4. Copy the exact "Host" value shown there');
}
  
  if (isConnected) {
    console.log('🎉 Ready to use Supabase database!');
    
    // Example: Test a simple query
    try {
      const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        LIMIT 5
      `);
      
      console.log('📋 Sample tables:', tables.rows);
    } catch (error) {
      console.log('ℹ️  No custom tables found (this is normal for new projects)');
    }
  }
  
  // Don't forget to close the pool when done
  // await closePool();
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}