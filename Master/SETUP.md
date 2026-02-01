# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed and running
- npm or yarn package manager

## Step-by-Step Setup

### 1. Navigate to Master Directory

```bash
cd Master
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker-compose ps
```

### 4. Create Environment File

Create a `.env` file in the `Master` directory:

```env
DATABASE_URL="postgresql://recruitment_user:recruitment_password@localhost:5433/recruitment_os?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Initialize Database Schema

```bash
npm run db:push
```

### 7. Seed Database with Initial Users

```bash
npm run db:seed
```

This creates three default users:
- **Admin**: `admin@recruitment.com` / `admin123`
- **Manager**: `manager@recruitment.com` / `manager123`
- **Recruiter**: `recruiter@recruitment.com` / `recruiter123`

### 8. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@recruitment.com",
    "password": "admin123"
  }'
```

Save the `token` from the response.

### 2. Get Jobs

```bash
curl http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Create a Job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "Remote",
    "description": "We are looking for an experienced software engineer...",
    "source": "LINKEDIN",
    "recruiterId": "YOUR_USER_ID"
  }'
```

### 4. Bulk Create Jobs (Chrome Extension)

```bash
curl -X POST http://localhost:3000/api/jobs/bulk \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "title": "Frontend Developer",
        "company": "Startup Inc",
        "location": "San Francisco",
        "description": "React developer needed...",
        "source": "INDEED",
        "recruiterId": "YOUR_USER_ID"
      },
      {
        "title": "Backend Developer",
        "company": "Big Corp",
        "location": "New York",
        "description": "Node.js developer needed...",
        "source": "NAUKRI",
        "recruiterId": "YOUR_USER_ID"
      }
    ]
  }'
```

## Useful Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database logs
docker-compose logs -f postgres

# Open Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Reset and seed database
npm run db:push
npm run db:seed
```

## Troubleshooting

### Database Connection Issues

1. Verify Docker is running:
   ```bash
   docker ps
   ```

2. Check if PostgreSQL container is running:
   ```bash
   docker-compose ps
   ```

3. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

### Prisma Client Not Generated

If you see errors about missing Prisma types:
```bash
npm run db:generate
```

### Port Already in Use

If port 5432 is already in use, modify `docker-compose.yml` to use a different port:
```yaml
ports:
  - "5433:5432"  # Change 5433 to any available port
```

Then update `DATABASE_URL` in `.env` accordingly.

