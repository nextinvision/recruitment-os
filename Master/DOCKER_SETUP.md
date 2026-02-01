# Docker Setup Guide

## Quick Start

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Verify it's running:**
   ```bash
   docker-compose ps
   ```

3. **Check logs:**
   ```bash
   docker-compose logs postgres
   ```

4. **Stop the database:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

## Database Connection Details

- **Host:** localhost
- **Port:** 5433 (mapped from container port 5432)
- **Database:** recruitment_os
- **Username:** recruitment_user
- **Password:** recruitment_password

## Connection String

```
postgresql://recruitment_user:recruitment_password@localhost:5433/recruitment_os?schema=public
```

## Troubleshooting

### Port Already in Use

If you see "port is already allocated", it means port 5433 is in use. You can:

1. **Change the port in docker-compose.yml:**
   ```yaml
   ports:
     - "5434:5432"  # Change 5434 to any available port
   ```

2. **Update DATABASE_URL in .env** to match the new port.

### Container Won't Start

1. Check if container exists:
   ```bash
   docker ps -a | findstr recruitment-os-db
   ```

2. Remove and recreate:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Database Connection Issues

1. Verify container is healthy:
   ```bash
   docker-compose ps
   ```
   Should show status as "healthy"

2. Test connection from inside container:
   ```bash
   docker exec recruitment-os-db psql -U recruitment_user -d recruitment_os -c "SELECT 1;"
   ```

3. Check database logs:
   ```bash
   docker-compose logs postgres --tail 50
   ```

### Reset Database

To completely reset the database (removes all data):

```bash
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

## Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker-compose logs -f postgres

# Execute command in container
docker exec -it recruitment-os-db psql -U recruitment_user -d recruitment_os

# Access container shell
docker exec -it recruitment-os-db sh

# View container resource usage
docker stats recruitment-os-db
```

