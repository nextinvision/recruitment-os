# Recruitment Operating System

A fullstack Next.js modular monolith with domain-driven architecture for internal recruitment agency operations.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Zod
- **Architecture**: Modular Monolith with Domain-Driven Design

## Project Structure

```
/app
  /api
    /auth          # Authentication endpoints
    /jobs          # Job CRUD and bulk ingestion
    /candidates    # Candidate CRUD
    /applications  # Application pipeline management

/modules
  /auth           # Authentication business logic
  /users          # User management with RBAC
  /jobs           # Job management logic
  /candidates     # Candidate management logic
  /applications   # Application pipeline logic

/lib
  db.ts           # Prisma client instance
  auth.ts         # JWT utilities
  rbac.ts         # Role-based access control

/prisma
  schema.prisma   # Database schema
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Master
npm install
```

### 2. Start Docker Services

Start all services (PostgreSQL, Redis, MinIO) using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL 16** on port 5433
  - Database: `recruitment_os`
  - User: `recruitment_user`
  - Password: `recruitment_password`
- **Redis 7** on port 6380
  - Password: `recruitment_redis_password`
- **MinIO** on ports 9010 (API) and 9011 (Console)
  - Access Key: `recruitment_minio_admin`
  - Secret Key: `recruitment_minio_password`
  - Console: http://localhost:9011

**Note:** Port 5433 is used to avoid conflicts with other PostgreSQL instances.

### 3. Set Up Environment Variables

Create a `.env` file in the `Master` directory (see `.env.example` for reference):

```env
# Database
DATABASE_URL="postgresql://recruitment_user:recruitment_password@localhost:5433/recruitment_os?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6380"
REDIS_PASSWORD="recruitment_redis_password"

# MinIO Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT="9010"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="recruitment_minio_admin"
MINIO_SECRET_KEY="recruitment_minio_password"
MINIO_PUBLIC_URL="http://localhost:9010"

# Environment
NODE_ENV="development"
```

### 4. Set Up Database and Storage

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Seed database with initial users (admin, manager, recruiter)
npm run db:seed

# Initialize MinIO buckets (resumes, documents, images)
npm run storage:init
```

**Default Users Created:**
- Admin: `admin@recruitment.com` / `admin123`
- Manager: `manager@recruitment.com` / `manager123`
- Recruiter: `recruiter@recruitment.com` / `recruiter123`

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email and password

### Jobs

- `GET /api/jobs` - Get all jobs (filtered by role)
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/[id]` - Get job by ID
- `PATCH /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `POST /api/jobs/bulk` - Bulk create jobs (for Chrome extension)

### Candidates

- `GET /api/candidates` - Get all candidates (filtered by role)
- `POST /api/candidates` - Create a new candidate
- `GET /api/candidates/[id]` - Get candidate by ID
- `PATCH /api/candidates/[id]` - Update candidate
- `DELETE /api/candidates/[id]` - Delete candidate

### Applications

- `GET /api/applications` - Get all applications (filtered by role)
- `POST /api/applications` - Create a new application
- `GET /api/applications/[id]` - Get application by ID
- `PATCH /api/applications/[id]` - Update application (stage)
- `DELETE /api/applications/[id]` - Delete application

## Authentication

All API endpoints (except `/api/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Role-Based Access Control (RBAC)

- **ADMIN**: Can access all resources
- **MANAGER**: Can access all resources
- **RECRUITER**: Can only access their own jobs, candidates, and applications

## Application Stages

1. IDENTIFIED
2. RESUME_UPDATED
3. COLD_MESSAGE_SENT
4. APPLIED
5. INTERVIEW
6. OFFER
7. REJECTED
8. CLOSED

## Job Sources

- LINKEDIN
- INDEED
- NAUKRI

## Development

```bash
# Start Docker services
docker-compose up -d

# Run development server
npm run dev

# Generate Prisma Client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database
npm run db:seed

# Run linting
npm run lint

# Stop Docker services
docker-compose down
```

## Production Build

```bash
npm run build
npm start
```
