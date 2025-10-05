# Database Configuration Guide

This project supports both local PostgreSQL and online/remote PostgreSQL (Supabase) with easy switching between modes.

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Configure your database credentials in `.env.local`**

3. **Switch between modes:**
   ```bash
   # Switch to local PostgreSQL
   npm run db:local
   
   # Switch to online/remote PostgreSQL
   npm run db:online
   
   # Check current mode
   npm run db:status
   ```

4. **Test your connection:**
   ```bash
   npm run db:test
   ```

## Environment Variables

### Database Mode Control
- `DB_MODE` - Set to `local` or `online` to control which database to use

### Local PostgreSQL Configuration (when DB_MODE=local)
- `LOCAL_DB_HOST` - Local PostgreSQL host (default: localhost)
- `LOCAL_DB_PORT` - Local PostgreSQL port (default: 5432)
- `LOCAL_DB_NAME` - Local database name (default: simmas)
- `LOCAL_DB_USER` - Local database user (default: postgres)
- `LOCAL_DB_PASSWORD` - Local database password

### Online/Remote PostgreSQL Configuration (when DB_MODE=online)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DB_HOST` - Remote database host
- `DB_PORT` - Remote database port
- `DB_NAME` - Remote database name
- `DB_USER` - Remote database user
- `DB_PASSWORD` - Remote database password
- `DB_DIRECT_HOST` - Direct connection host (fallback)
- `DB_DIRECT_PORT` - Direct connection port
- `DB_DIRECT_USER` - Direct connection user
- `SUPABASE_PASSWORD` - Direct connection password

## Available Scripts

- `npm run db:local` - Switch to local PostgreSQL mode
- `npm run db:online` - Switch to online/remote PostgreSQL mode
- `npm run db:status` - Show current database configuration
- `npm run db:help` - Show help information
- `npm run db:test` - Test database connection

## Local PostgreSQL Setup

### 1. Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### 2. Start PostgreSQL Service
```bash
# Windows
net start postgresql

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE simmas;

# Create user (optional)
CREATE USER simmas_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE simmas TO simmas_user;
```

### 4. Configure Environment
Update your `.env.local` file:
```env
DB_MODE=local
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=simmas
LOCAL_DB_USER=postgres
LOCAL_DB_PASSWORD=your_password
```

## Online/Remote PostgreSQL Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Get Database Credentials
1. Go to your Supabase dashboard
2. Navigate to Settings → Database
3. Copy the connection parameters

### 3. Configure Environment
Update your `.env.local` file:
```env
DB_MODE=online
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your_database_password
DB_DIRECT_HOST=db.your-project-ref.supabase.co
DB_DIRECT_PORT=5432
DB_DIRECT_USER=postgres
SUPABASE_PASSWORD=your_database_password
```

## Prisma Integration

The system automatically generates the correct `DATABASE_URL` and `DIRECT_URL` for Prisma based on your current mode.

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Migrations
```bash
# For local database
npm run db:local
npx prisma migrate dev

# For remote database
npm run db:online
npx prisma migrate deploy
```

## Troubleshooting

### Connection Issues

1. **Check your database mode:**
   ```bash
   npm run db:status
   ```

2. **Test your connection:**
   ```bash
   npm run db:test
   ```

3. **Verify environment variables:**
   - Make sure `.env.local` exists and is properly configured
   - Check that all required variables are set
   - Ensure passwords don't contain special characters that need escaping

### Local PostgreSQL Issues

1. **Service not running:**
   ```bash
   # Check if PostgreSQL is running
   pg_ctl status
   
   # Start PostgreSQL
   pg_ctl start
   ```

2. **Connection refused:**
   - Check if PostgreSQL is listening on the correct port
   - Verify firewall settings
   - Ensure the database exists

3. **Authentication failed:**
   - Check username and password
   - Verify user has proper permissions
   - Check `pg_hba.conf` configuration

### Remote PostgreSQL Issues

1. **SSL connection issues:**
   - The system automatically handles SSL configuration
   - Check if your database supports SSL connections

2. **Host not found:**
   - Verify the host address is correct
   - Check if you're using the pooled connection or direct connection
   - Ensure your IP is whitelisted (if required)

3. **Authentication failed:**
   - Double-check your database credentials
   - Verify the user has proper permissions
   - Check if the password contains special characters

## Development Workflow

### Switching Between Modes

1. **For local development:**
   ```bash
   npm run db:local
   npm run dev
   ```

2. **For testing with remote database:**
   ```bash
   npm run db:online
   npm run dev
   ```

### Database Migrations

1. **Local development:**
   ```bash
   npm run db:local
   npx prisma migrate dev --name your_migration_name
   ```

2. **Production deployment:**
   ```bash
   npm run db:online
   npx prisma migrate deploy
   ```

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for your databases
- Regularly rotate your API keys
- Consider using connection pooling for production
- Enable SSL for remote connections

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run `npm run db:test` to diagnose connection issues
3. Check the console logs for detailed error messages
4. Verify your environment configuration with `npm run db:status`
