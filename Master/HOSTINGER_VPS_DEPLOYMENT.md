# Hostinger VPS Deployment Guide - Recruitment OS

Complete step-by-step guide to deploy Recruitment OS on Hostinger VPS.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [Database Setup (PostgreSQL)](#database-setup-postgresql)
4. [Redis Setup](#redis-setup)
5. [MinIO Setup (Object Storage)](#minio-setup-object-storage)
6. [Application Deployment](#application-deployment)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [PM2 Process Management](#pm2-process-management)
10. [Extension Configuration](#extension-configuration)
11. [Testing & Verification](#testing--verification)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance & Updates](#maintenance--updates)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Hostinger VPS with root/SSH access
- ✅ Domain name pointing to your VPS IP (e.g., `api.yourdomain.com`)
- ✅ Basic knowledge of Linux commands
- ✅ SSH client (PuTTY, Terminal, or VS Code Remote)

**Recommended VPS Specifications:**
- **CPU:** 2+ cores
- **RAM:** 4GB+ (8GB recommended)
- **Storage:** 50GB+ SSD
- **OS:** Ubuntu 20.04/22.04 LTS

---

## VPS Initial Setup

### Step 1: Connect to Your VPS

```bash
# Using SSH (replace with your VPS IP)
ssh root@your-vps-ip

# Or if using a specific user
ssh username@your-vps-ip
```

### Step 2: Update System

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential
```

### Step 3: Install Node.js 18+

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version
```

### Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually: sudo env PATH=$PATH:... pm2 startup systemd -u your-user --hp /home/your-user)
```

### Step 5: Install Nginx

```bash
# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### Step 6: Install Docker (Optional but Recommended)

If you want to use Docker for PostgreSQL, Redis, and MinIO:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Start Docker service
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker-compose --version
```

---

## Database Setup (PostgreSQL)

You have two options:

### Option A: Docker (Recommended - Easier)

```bash
# Create directory for docker-compose
mkdir -p /opt/recruitment-os
cd /opt/recruitment-os

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: recruitment-postgres
    restart: always
    environment:
      POSTGRES_DB: recruitment_os
      POSTGRES_USER: recruitment_user
      POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recruitment_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: recruitment-redis
    restart: always
    command: redis-server --requirepass CHANGE_REDIS_PASSWORD
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: recruitment-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: recruitment_minio_admin
      MINIO_ROOT_PASSWORD: CHANGE_MINIO_PASSWORD
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  minio_data:
EOF

# IMPORTANT: Edit the file and change passwords
nano docker-compose.yml

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Update the passwords in `docker-compose.yml`:**
- `POSTGRES_PASSWORD`: Strong password for PostgreSQL
- `CHANGE_REDIS_PASSWORD`: Strong password for Redis
- `MINIO_ROOT_PASSWORD`: Strong password for MinIO

### Option B: Native Installation

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE recruitment_os;
CREATE USER recruitment_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE recruitment_os TO recruitment_user;
\q
EOF

# Install Redis
apt install -y redis-server

# Configure Redis password
nano /etc/redis/redis.conf
# Find: # requirepass foobared
# Change to: requirepass YOUR_REDIS_PASSWORD

# Restart Redis
systemctl restart redis-server
systemctl enable redis-server
```

---

## Redis Setup

If using Docker (Option A), Redis is already set up. If using native installation:

```bash
# Verify Redis is running
redis-cli ping
# Should return: PONG

# Test with password
redis-cli -a YOUR_REDIS_PASSWORD ping
```

---

## MinIO Setup (Object Storage)

If using Docker (Option A), MinIO is already set up. Access the console at `http://your-vps-ip:9001`

**Login credentials:**
- Username: `recruitment_minio_admin`
- Password: (from docker-compose.yml)

**Create buckets:**
1. Go to MinIO Console (http://your-vps-ip:9001)
2. Login with credentials
3. Create buckets:
   - `resumes`
   - `documents`
   - `images`

**Or via command line:**
```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
mv mc /usr/local/bin/

# Configure MinIO client
mc alias set local http://localhost:9000 recruitment_minio_admin YOUR_MINIO_PASSWORD

# Create buckets
mc mb local/resumes
mc mb local/documents
mc mb local/images

# Set public read policy (if needed)
mc anonymous set public local/resumes
```

---

## Application Deployment

### Step 1: Create Application Directory

```bash
# Create directory structure
mkdir -p /opt/recruitment-os
cd /opt/recruitment-os
```

### Step 2: Upload Application Files

**Option A: Using Git (Recommended)**

```bash
# Clone your repository (if using Git)
git clone https://your-repo-url.git Master

# Or if repository is private, use SSH key
git clone git@github.com:your-username/your-repo.git Master
```

**Option B: Using SCP (From Local Machine)**

```bash
# On your local machine
cd /path/to/Recruitment-os
tar -czf master-deploy.tar.gz Master/

# Upload to VPS
scp master-deploy.tar.gz root@your-vps-ip:/opt/recruitment-os/

# On VPS, extract
cd /opt/recruitment-os
tar -xzf master-deploy.tar.gz
```

**Option C: Using SFTP**

Use FileZilla, WinSCP, or VS Code Remote to upload the `Master` folder to `/opt/recruitment-os/`

### Step 3: Install Dependencies

```bash
cd /opt/recruitment-os/Master

# Install dependencies
npm install

# If you get permission errors, you may need to:
# npm install --unsafe-perm=true --allow-root
```

### Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env
```

**Add the following (update with your actual values):**

```env
# Environment
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Database (PostgreSQL)
# If using Docker on same server:
DATABASE_URL=postgresql://recruitment_user:YOUR_POSTGRES_PASSWORD@localhost:5432/recruitment_os?schema=public

# If using external database:
# DATABASE_URL=postgresql://user:password@database-host:5432/recruitment_os?schema=public

# JWT Authentication
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MIN_32_CHARACTERS_LONG_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Redis
# If using Docker on same server:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# If using external Redis:
# REDIS_HOST=your-redis-host
# REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password

# MinIO (Object Storage)
# If using Docker on same server:
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=recruitment_minio_admin
MINIO_SECRET_KEY=YOUR_MINIO_PASSWORD
MINIO_PUBLIC_URL=http://localhost:9000

# Email Service (SMTP)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Recruitment OS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_TLS_REJECT_UNAUTHORIZED=true

# Optional: WhatsApp (if using)
# WHATSAPP_API_URL=https://graph.facebook.com
# WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
# WHATSAPP_ACCESS_TOKEN=your_access_token
# WHATSAPP_API_VERSION=v18.0
# WHATSAPP_VERIFY_TOKEN=your_verify_token
```

**Important:** 
- Replace all `YOUR_*` placeholders with actual values
- Use strong passwords (minimum 32 characters for JWT_SECRET)
- For Gmail SMTP, use an [App Password](https://support.google.com/accounts/answer/185833)

### Step 5: Generate Prisma Client

```bash
cd /opt/recruitment-os/Master

# Generate Prisma Client
npm run db:generate
```

### Step 6: Initialize Database

```bash
# Push database schema
npm run db:push

# Seed database with initial users
npm run db:seed
```

**Default users created:**
- Admin: `admin@recruitment.com` / `admin123`
- Manager: `manager@recruitment.com` / `manager123`
- Recruiter: `recruiter@recruitment.com` / `recruiter123`

**⚠️ IMPORTANT:** Change these passwords after first login!

### Step 7: Initialize MinIO Storage

```bash
# Initialize MinIO buckets
npm run storage:init
```

### Step 8: Build Application

```bash
# Build Next.js application
npm run build
```

This will:
- Generate Prisma Client
- Build Next.js application
- Create optimized production bundle

---

## Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
# Create configuration file
nano /etc/nginx/sites-available/recruitment-os
```

**Add the following configuration:**

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificate paths (will be set up by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # CORS Headers for Chrome Extension
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Client-Type, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight OPTIONS requests
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Client-Type, X-Requested-With";
        add_header Access-Control-Max-Age "1728000";
        add_header Content-Type "text/plain charset=UTF-8";
        add_header Content-Length "0";
        return 204;
    }

    # Logging
    access_log /var/log/nginx/recruitment-os-access.log;
    error_log /var/log/nginx/recruitment-os-error.log;

    # Client body size (for file uploads)
    client_max_body_size 50M;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Important:** Replace `api.yourdomain.com` with your actual domain name.

### Step 2: Enable Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/recruitment-os /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

---

## SSL Certificate Setup

### Step 1: Install Certbot

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Get SSL certificate (replace with your domain)
certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (select 2 - Redirect)
```

### Step 3: Test Auto-Renewal

```bash
# Test renewal process
certbot renew --dry-run

# Certbot automatically sets up renewal, but verify:
systemctl status certbot.timer
```

SSL certificates are valid for 90 days and auto-renew before expiration.

---

## PM2 Process Management

### Step 1: Start Application with PM2

```bash
cd /opt/recruitment-os/Master

# Start application
pm2 start npm --name "recruitment-os" -- start

# Or use ecosystem file (recommended)
```

### Step 2: Create PM2 Ecosystem File (Recommended)

```bash
# Create ecosystem file
nano /opt/recruitment-os/Master/ecosystem.config.js
```

**Add the following:**

```javascript
module.exports = {
  apps: [{
    name: 'recruitment-os',
    script: 'npm',
    args: 'start',
    cwd: '/opt/recruitment-os/Master',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/recruitment-os-error.log',
    out_file: '/var/log/pm2/recruitment-os-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10
  }]
}
```

### Step 3: Start with Ecosystem File

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# View status
pm2 status

# View logs
pm2 logs recruitment-os

# View real-time monitoring
pm2 monit
```

### Step 4: Configure PM2 Startup

```bash
# Generate startup script
pm2 startup

# Follow the command shown (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-user --hp /home/your-user

# Save current process list
pm2 save
```

---

## Extension Configuration

### Step 1: Build Extension for Production

On your local machine:

```bash
cd extension

# Windows
build-production.bat https://api.yourdomain.com

# Linux/Mac
chmod +x build-production.sh
./build-production.sh https://api.yourdomain.com
```

### Step 2: Package Extension

```bash
# Create zip file
zip -r recruitment-os-extension.zip dist/ manifest.json icons/
```

### Step 3: Distribute Extension

- **Chrome Web Store:** Upload zip to developer dashboard
- **Manual:** Share zip file, users extract and load unpacked
- **Enterprise:** Use Chrome Enterprise policies

---

## Testing & Verification

### Step 1: Test API Endpoints

```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Test login endpoint (should return error, but confirms API is running)
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

### Step 2: Test from Browser

1. Open `https://api.yourdomain.com` in browser
2. Should redirect to login page
3. Login with default credentials:
   - Email: `admin@recruitment.com`
   - Password: `admin123`

### Step 3: Test Extension Connection

1. Install extension in Chrome
2. Open extension popup
3. Click "Test Connection" button
4. Should show "Connected"

### Step 4: Check Logs

```bash
# Application logs
pm2 logs recruitment-os

# Nginx logs
tail -f /var/log/nginx/recruitment-os-access.log
tail -f /var/log/nginx/recruitment-os-error.log

# System logs
journalctl -u nginx -f
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs recruitment-os --lines 100

# Restart application
pm2 restart recruitment-os

# Check if port 3000 is in use
netstat -tulpn | grep 3000
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U recruitment_user -d recruitment_os

# Check if PostgreSQL is running
systemctl status postgresql
# or
docker ps | grep postgres

# Check database URL in .env
cat /opt/recruitment-os/Master/.env | grep DATABASE_URL
```

### Nginx 502 Bad Gateway

```bash
# Check if application is running
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/recruitment-os-error.log

# Test Nginx configuration
nginx -t

# Check if port 3000 is accessible
curl http://localhost:3000/health
```

### CORS Errors

1. Verify CORS headers in Nginx config
2. Check that `Access-Control-Allow-Origin` includes `*` or specific origins
3. Verify `X-Client-Type: extension` header is allowed
4. Check browser console for specific CORS error messages

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/api.yourdomain.com/cert.pem -noout -dates
```

### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart recruitment-os

# Check for memory leaks in logs
pm2 logs recruitment-os | grep -i "memory\|heap"
```

---

## Maintenance & Updates

### Update Application

```bash
# Stop application
pm2 stop recruitment-os

# Backup current version
cp -r /opt/recruitment-os/Master /opt/recruitment-os/Master.backup.$(date +%Y%m%d)

# Pull latest changes (if using Git)
cd /opt/recruitment-os/Master
git pull

# Or upload new files via SCP/SFTP

# Install new dependencies
npm install

# Run database migrations (if any)
npm run db:push

# Rebuild application
npm run build

# Start application
pm2 start recruitment-os

# Check status
pm2 status
pm2 logs recruitment-os
```

### Backup Database

```bash
# Create backup
pg_dump -h localhost -U recruitment_user -d recruitment_os > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U recruitment_user -d recruitment_os < backup_20240101.sql
```

### Monitor Application

```bash
# Real-time monitoring
pm2 monit

# View all logs
pm2 logs

# View specific app logs
pm2 logs recruitment-os

# View system resources
htop
# or
top
```

### Set Up Log Rotation

```bash
# Install logrotate (usually pre-installed)
apt install -y logrotate

# Create logrotate config
nano /etc/logrotate.d/recruitment-os
```

**Add:**

```
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 root root
}
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Using strong JWT_SECRET (32+ characters)
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Database access restricted
- [ ] Redis password set
- [ ] MinIO access keys secured
- [ ] SMTP credentials secured
- [ ] Regular backups configured
- [ ] Logs monitored
- [ ] Updates applied regularly

### Configure Firewall (UFW)

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Quick Reference Commands

```bash
# Application
pm2 start recruitment-os
pm2 stop recruitment-os
pm2 restart recruitment-os
pm2 logs recruitment-os
pm2 status

# Nginx
systemctl status nginx
systemctl restart nginx
nginx -t
tail -f /var/log/nginx/recruitment-os-error.log

# Database (Docker)
docker-compose ps
docker-compose logs postgres
docker-compose restart postgres

# Database (Native)
systemctl status postgresql
systemctl restart postgresql
sudo -u postgres psql

# SSL
certbot certificates
certbot renew

# System
df -h                    # Disk usage
free -h                  # Memory usage
htop                     # System monitor
```

---

## Support & Resources

- **PM2 Documentation:** https://pm2.keymetrics.io/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Prisma:** https://www.prisma.io/docs

---

## Next Steps

1. ✅ Deploy Master to VPS (this guide)
2. ✅ Build extension with production URL
3. ✅ Distribute extension to users
4. ✅ Monitor application performance
5. ✅ Set up automated backups
6. ✅ Configure monitoring/alerts

**Congratulations! Your Recruitment OS is now deployed on Hostinger VPS! 🎉**

