# Database Migration Guide - Preparation Pipeline

## Overview
This guide explains how to apply the database migration for the Client Preparation Pipeline feature.

## Prerequisites
- PostgreSQL database running
- Database connection string configured in `.env` file
- Prisma CLI installed (`npm install -g prisma` or use `npx`)

## Migration Steps

### 1. Backup Database (Recommended)
```bash
# Create a backup before migration
pg_dump -h localhost -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Migration
```bash
cd /root/recruitment-os/Master
npx prisma migrate dev --name add_preparation_pipeline
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma client

### 3. Verify Migration
```bash
# Check migration status
npx prisma migrate status

# Verify schema is in sync
npx prisma db pull
```

### 4. Regenerate Prisma Client (if needed)
```bash
npx prisma generate
```

## What the Migration Adds

### New Enums
- `ServiceType`: STANDARD, PREMIUM, EXECUTIVE, CONTRACT, CUSTOM
- `DocumentType`: JOB_SEARCH_STRATEGY, CONTRACT, AGREEMENT, OTHER

### New Tables
- `cover_letters`: Stores cover letter versions for clients
- `client_documents`: Stores documents (e.g., job search strategy) for clients

### Modified Tables
- `clients`: Added 13 new columns for preparation pipeline tracking

## Rollback (if needed)

If you need to rollback the migration:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back add_preparation_pipeline

# Or manually revert
npx prisma migrate resolve --applied add_preparation_pipeline --rolled-back
```

## Post-Migration

After migration, existing clients will have:
- All new fields set to `null` or `false` (default values)
- No impact on existing functionality
- Can start using preparation pipeline features immediately

## Verification Checklist

- [ ] Migration completed successfully
- [ ] Prisma client regenerated
- [ ] Can create clients with new fields
- [ ] Can view preparation pipeline status
- [ ] Can upload cover letters
- [ ] Can upload documents
- [ ] Can initiate job search

## Troubleshooting

### Migration Fails
1. Check database connection
2. Verify PostgreSQL version (should be 12+)
3. Check for existing data conflicts
4. Review migration SQL in `prisma/migrations/`

### Prisma Client Errors
1. Run `npx prisma generate`
2. Restart development server
3. Clear node_modules and reinstall if needed

### Type Errors
1. Ensure Prisma client is regenerated
2. Restart TypeScript server in IDE
3. Check that all imports use `@prisma/client`

