# Deployment Guide — Güzellik Merkezi E-commerce

This guide covers everything required to deploy the `niltellioglu` monorepo (Next.js 14 frontend + Express API) to a production VPS or cloud server.

---


cd /var/www/guzellikmerkezi
git pull
pnpm install --frozen-lockfile
cd apps/api && npx prisma migrate deploy && cd ../..
pnpm --filter api db:generate
pnpm --filter web build
cp -r apps/web/public  apps/web/.next/standalone/apps/web/public
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
pm2 reload all 

## 1. Server Hosting Requirements

### Recommended Specifications

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2–4 GB      |
| Storage  | 20 GB SSD | 40 GB SSD |
| Bandwidth | 1 TB/month | 2 TB/month |

### Operating System

- **Ubuntu 22.04 LTS** (preferred) or Ubuntu 20.04 LTS
- Debian 12 is also acceptable

### Required Open Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 22   | TCP | SSH access |
| 80   | TCP | HTTP (redirects to HTTPS) |
| 443  | TCP | HTTPS (production traffic) |
| 3000 | TCP | Next.js (internal only, blocked externally) |
| 4000 | TCP | Express API (internal only, blocked externally) |
| 3306 | TCP | MySQL (localhost only — never expose publicly) |

### Firewall Rules (UFW example)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw deny 4000/tcp
sudo ufw deny 3306/tcp
sudo ufw enable
```

---

## 2. Software and Runtime Requirements

### Runtime Versions

| Software | Version |
|----------|---------|
| Node.js  | 20.x LTS (≥ 20.0.0 required) |
| pnpm     | 9.x (≥ 9.0.0 required) |
| MySQL    | 8.0 |
| Nginx    | 1.18+ |
| PM2      | 5.x |
| Certbot  | Latest (Let's Encrypt) |

### Package Managers

- **pnpm** is required (this is a pnpm workspace monorepo). npm/yarn will not work.

### Database

- MySQL 8.0+ with `utf8mb4` charset and `utf8mb4_0900_ai_ci` collation
- The database name is `niltellioglu` (configurable via `DATABASE_URL`)

### Web Server / Reverse Proxy

- **Nginx** as reverse proxy in front of both Next.js (port 3000) and Express API (port 4000)
- A pre-built Nginx config is located at `deploy/nginx.conf`

### Process Manager

- **PM2** — config is at `ecosystem.config.js` in the project root
- Manages two processes: `guzellik-api` (Express) and `guzellik-web` (Next.js)

### Environment Variables

All secrets live in `apps/api/.env`. Copy from `.env.example`:

```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/niltellioglu"
MYSQL_HOST="localhost"
MYSQL_USER="USER"
MYSQL_PASSWORD="PASSWORD"
MYSQL_DATABASE="niltellioglu"
REDIS_HOST="localhost"
REDIS_PORT="6379"
SESSION_SECRET="<random 64-char string>"
CSRF_SECRET="<random 64-char string>"
PAYTR_MERCHANT_ID="<from PayTR dashboard>"
PAYTR_MERCHANT_KEY="<from PayTR dashboard>"
PAYTR_MERCHANT_SALT="<from PayTR dashboard>"
PAYTR_TEST_MODE="0"
WEB_BASE_URL="https://guzellikmerkezi.com.tr"
API_BASE_URL="https://guzellikmerkezi.com.tr"
NODE_ENV="production"
```

Also create `apps/web/.env.local` for Next.js:

```
NEXT_PUBLIC_API_URL="https://guzellikmerkezi.com.tr/api"
```

### Required Third-Party Services

| Service | Purpose |
|---------|---------|
| PayTR | Payment processing (obtain merchant credentials from paytr.com) |
| Let's Encrypt (Certbot) | Free SSL/TLS certificates |
| (Optional) Redis | Session store and rate limiting |

---

## 3. Pre-Deployment Checklist

### Build Requirements

- [ ] All TypeScript compiles without errors: `pnpm typecheck`
- [ ] Next.js standalone build succeeds: `pnpm --filter web build`
- [ ] Express API TypeScript compiles: `pnpm --filter api build`
- [ ] All API tests pass: `pnpm test`
- [ ] Prisma client generated: `pnpm --filter api db:generate`

### Configuration Files

- [ ] `.env.example` reviewed and production `.env` created in `apps/api/`
- [ ] `apps/web/.env.local` created with `NEXT_PUBLIC_API_URL`
- [ ] `next.config.js` has `output: "standalone"` set
- [ ] `ecosystem.config.js` paths verified for server layout

### Secrets and Credentials

- [ ] `SESSION_SECRET` is a cryptographically random string (≥ 32 chars)
- [ ] `CSRF_SECRET` is a cryptographically random string (≥ 32 chars)
- [ ] PayTR credentials obtained from merchant dashboard
- [ ] `PAYTR_TEST_MODE` set to `"0"` for production
- [ ] MySQL user created with limited privileges (not `root`)
- [ ] No secrets committed to git — verify with `git log --all -p | grep -i "secret\|password\|key\|salt"`

### Domain and SSL

- [ ] Domain DNS A record points to server IP
- [ ] `www` subdomain CNAME or A record configured
- [ ] SSL certificate issued via Certbot before going live
- [ ] Nginx config updated with correct domain name

---

## 4. Deployment Instructions

### Step 1 — Provision the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL 8.0
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2 — Configure MySQL

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE niltellioglu CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'salonapp'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON niltellioglu.* TO 'salonapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3 — Clone the Repository

```bash
sudo mkdir -p /var/www/guzellikmerkezi
sudo chown $USER:$USER /var/www/guzellikmerkezi

cd /var/www/guzellikmerkezi
git clone https://github.com/YOUR_ORG/niltellioglu.git .
```

### Step 4 — Configure Environment Variables

```bash
# API environment
cp .env.example apps/api/.env
nano apps/api/.env
# Fill in DATABASE_URL, SESSION_SECRET, CSRF_SECRET, PayTR credentials, NODE_ENV=production

# Web environment
nano apps/web/.env.local
# Add: NEXT_PUBLIC_API_URL=https://guzellikmerkezi.com.tr/api
```

### Step 5 — Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 6 — Run Database Migrations and Seed

```bash
# Generate Prisma client
pnpm --filter api db:generate

# Apply migrations (creates all tables)
cd apps/api
npx prisma migrate deploy
cd ../..

# (Optional) Seed initial products
pnpm --filter api db:seed
```

### Step 7 — Build the Project

```bash
# Build Express API (TypeScript → dist/)
pnpm --filter api build

# Build Next.js with standalone output
pnpm --filter web build

# Copy Next.js public assets into standalone build
cp -r apps/web/public apps/web/.next/standalone/apps/web/public
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
```

### Step 8 — Update ecosystem.config.js for Production Build

The default `ecosystem.config.js` runs `tsx` (dev mode). For production, update the API entry to use the compiled `dist/`:

```js
// In ecosystem.config.js, change the api app to:
{
  name: "guzellik-api",
  cwd: "./apps/api",
  script: "node",
  args: "dist/index.js",
  env_production: {
    NODE_ENV: "production",
    PORT: "4000",
  },
  // ... rest unchanged
}
```

### Step 9 — Create Log Directory

```bash
mkdir -p /var/www/guzellikmerkezi/logs
```

### Step 10 — Start the Application with PM2

```bash
cd /var/www/guzellikmerkezi

# Start both apps in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 process list so it survives reboots
pm2 save

# Register PM2 as a system startup service
pm2 startup systemd
# Run the command PM2 prints — it looks like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Step 11 — Configure Nginx

```bash
# Copy the provided config
sudo cp /var/www/guzellikmerkezi/deploy/nginx.conf \
        /etc/nginx/sites-available/guzellikmerkezi.com.tr

# Enable the site
sudo ln -s /etc/nginx/sites-available/guzellikmerkezi.com.tr \
           /etc/nginx/sites-enabled/

# Disable the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 12 — Enable HTTPS with Let's Encrypt

```bash
# Obtain certificate (will auto-edit the Nginx config)
sudo certbot --nginx -d guzellikmerkezi.com.tr -d www.guzellikmerkezi.com.tr

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot adds a systemd timer or cron job for automatic renewal.

---

## 5. Post-Deployment Tasks

### Testing the Deployed App

```bash
# Check both PM2 processes are online
pm2 status

# Smoke-test the API health endpoint
curl https://guzellikmerkezi.com.tr/api/products

# Test HTTPS redirect
curl -I http://guzellikmerkezi.com.tr

# Check SSL certificate
curl -v https://guzellikmerkezi.com.tr 2>&1 | grep "SSL certificate"
```

Also test manually:
- [ ] Home page loads correctly
- [ ] Product listing and detail pages load
- [ ] User registration and login work
- [ ] Add to cart and checkout flow work
- [ ] PayTR iframe appears on payment page
- [ ] Admin panel login works at `/admin/giris`
- [ ] Contact form submits without error

### Logs and Monitoring

```bash
# Live PM2 logs for both apps
pm2 logs

# API logs only
pm2 logs guzellik-api

# Web logs only
pm2 logs guzellik-web

# Log files on disk
tail -f /var/www/guzellikmerkezi/logs/api-error.log
tail -f /var/www/guzellikmerkezi/logs/web-error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# MySQL error log
sudo tail -f /var/log/mysql/error.log
```

### Backup Recommendations

**Database — daily `mysqldump`:**

```bash
# Create a backup script
cat << 'EOF' > /home/$USER/backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M)
mysqldump -u salonapp -p'STRONG_PASSWORD_HERE' niltellioglu \
  | gzip > /var/backups/niltellioglu-$DATE.sql.gz
# Keep only last 30 days
find /var/backups/ -name "niltellioglu-*.sql.gz" -mtime +30 -delete
EOF
chmod +x /home/$USER/backup-db.sh

# Schedule with cron (daily at 3am)
(crontab -l 2>/dev/null; echo "0 3 * * * /home/$USER/backup-db.sh") | crontab -
```

**Uploaded images:** If product images are stored on disk (not a CDN), back up `apps/web/public/images/` to an offsite location (e.g., S3-compatible storage or `rsync` to a backup server).

### Restart and Update Procedure

**Restarting the application:**

```bash
pm2 restart all
# or individually:
pm2 restart guzellik-api
pm2 restart guzellik-web
```

**Deploying a code update:**

```bash
cd /var/www/guzellikmerkezi

# Pull latest code
git pull origin main

# Install any new dependencies
pnpm install --frozen-lockfile

# Run any new database migrations
cd apps/api && npx prisma migrate deploy && cd ../..

# Rebuild
pnpm --filter api build
pnpm --filter web build

# Copy Next.js static assets
cp -r apps/web/public apps/web/.next/standalone/apps/web/public
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static

# Reload apps with zero-downtime restart
pm2 reload all
```

---

## 6. Troubleshooting

### PM2 app not starting

```bash
# Check process status and exit codes
pm2 status
pm2 logs guzellik-api --lines 50

# Common cause: wrong cwd or script path in ecosystem.config.js
# Verify dist/index.js exists after build:
ls apps/api/dist/index.js
```

### `Cannot connect to MySQL` / Prisma connection error

```bash
# Test MySQL connection manually
mysql -u salonapp -p niltellioglu

# Check DATABASE_URL in apps/api/.env matches MySQL credentials
grep DATABASE_URL apps/api/.env

# Check MySQL is running
sudo systemctl status mysql
```

### Port 3000 / 4000 not reachable from Nginx

```bash
# Verify apps are listening
ss -tlnp | grep -E '3000|4000'

# Check PM2 logs for startup errors
pm2 logs --lines 30

# Test API directly on the server (bypassing Nginx)
curl http://127.0.0.1:4000/api/products
```

### Nginx 502 Bad Gateway

- PM2 app is not running — check `pm2 status`
- App crashed on startup — check `pm2 logs`
- Wrong `proxy_pass` port — verify Nginx config matches PM2 ports

```bash
sudo nginx -t          # syntax check
sudo systemctl reload nginx
```

### SSL certificate errors

```bash
# Check certificate validity
sudo certbot certificates

# Force renewal if expiring
sudo certbot renew --force-renewal

# Verify Nginx SSL paths match the certificate paths
grep ssl_certificate /etc/nginx/sites-available/guzellikmerkezi.com.tr
```

### PayTR payment not working

- `PAYTR_TEST_MODE` must be `"0"` in production
- `WEB_BASE_URL` and `API_BASE_URL` must use the live `https://` domain
- The PayTR callback URL must be registered in the PayTR merchant dashboard: `https://guzellikmerkezi.com.tr/api/payments/callback`
- Verify the merchant credentials in `.env` match what PayTR issued

```bash
# Check PayTR env vars are loaded
grep PAYTR apps/api/.env
```

### Build fails — out of memory

```bash
# Increase Node.js heap for the build
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter web build
```

### Prisma migration errors on deploy

```bash
# Check migration status
cd apps/api
npx prisma migrate status

# If shadow database error, ensure MySQL user has CREATE privilege
# or use deploy (not dev) for production:
npx prisma migrate deploy
```

### Session not persisting / users logged out on restart

- `SESSION_SECRET` must be identical between restarts — do not use a random value generated at boot
- Sessions are stored in the MySQL `Session` table via Prisma — verify the table exists:

```sql
SHOW TABLES LIKE 'Session';
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all apps | `pm2 start ecosystem.config.js --env production` |
| Stop all apps | `pm2 stop all` |
| Restart all apps | `pm2 reload all` |
| View live logs | `pm2 logs` |
| Run DB migrations | `cd apps/api && npx prisma migrate deploy` |
| Full rebuild + reload | see "Update Procedure" above |
| Nginx config test | `sudo nginx -t` |
| Nginx reload | `sudo systemctl reload nginx` |
| Renew SSL | `sudo certbot renew` |
| DB backup now | `/home/$USER/backup-db.sh` |


