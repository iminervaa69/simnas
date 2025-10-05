import { testAllConnections } from './src/lib/database/connection'

// Load environment variables from .env.local
try {
  require('dotenv').config({ path: '.env.local' })
} catch (error) {
  console.log('ℹ️  dotenv not found, using system environment variables')
}

// Main test function
async function main() {
  console.log('🚀 Starting database connection test...\n')
  
  try {
    await testAllConnections()
    console.log('\n🎉 Database connection test completed successfully!')
  } catch (error) {
    console.error('\n❌ Database connection test failed:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}