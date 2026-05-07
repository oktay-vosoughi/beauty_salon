# Deployment Checklist — Güzellik Merkezi

## Server Requirements
- Ubuntu 22.04 LTS (or similar Debian-based VPS)
- Node.js 20 LTS
- pnpm 9+
- MySQL 8.0+ (or PlanetScale / managed MySQL)
- Nginx + Certbot
- PM2 (`npm install -g pm2`)

---

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/niltellioglu"
SESSION_SECRET="<random 64-char string>"
CSRF_SECRET="<random 64-char string>"
PAYTR_MERCHANT_ID="<your PayTR merchant ID>"
PAYTR_MERCHANT_KEY="<your PayTR merchant key>"
PAYTR_MERCHANT_SALT="<your PayTR merchant salt>"
PAYTR_TEST_MODE="0"   # Change to 0 for live payments
WEB_BASE_URL="https://guzellikmerkezi.com.tr"
API_BASE_URL="http://127.0.0.1:4000"   # internal, not public
NODE_ENV="production"
PORT="4000"
```

**Never commit `.env` to git.**

---

## 2. Database Setup

```bash
# On server, after creating MySQL DB and user:
cd apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts   # Only for initial seed — skip on updates
```

---

## 3. Build

```bash
# From repo root
pnpm install --frozen-lockfile

# Build API (TypeScript)
cd apps/api && pnpm build && cd ../..

# Build Next.js (standalone mode — add output: 'standalone' to next.config.mjs first)
cd apps/web && pnpm build && cd ../..

# Copy public assets for standalone
cp -r apps/web/public apps/web/.next/standalone/public
cp -r apps/web/.next/static apps/web/.next/standalone/.next/static
```

> **Note:** Add `output: 'standalone'` to `next.config.mjs` for production:
> ```js
> const nextConfig = { output: 'standalone', ... }
> ```

---

## 4. Start with PM2

```bash
# From repo root
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # Enable auto-restart on reboot
```

Monitor:
```bash
pm2 logs
pm2 status
pm2 monit
```

---

## 5. Nginx + HTTPS

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d guzellikmerkezi.com.tr -d www.guzellikmerkezi.com.tr

# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/guzellikmerkezi.com.tr
sudo ln -s /etc/nginx/sites-available/guzellikmerkezi.com.tr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. PayTR Integration

1. Log into PayTR merchant panel → get Merchant ID, Merchant Key, Merchant Salt
2. Set callback URL: `https://guzellikmerkezi.com.tr/api/payments/paytr/callback`
3. Set `PAYTR_TEST_MODE=0` in `.env` after successful test transaction
4. Test with PayTR test card numbers before going live

---

## 7. Security Checklist

- [ ] `.env` not committed to git (check `.gitignore`)
- [ ] `SESSION_SECRET` is ≥ 32 random characters
- [ ] MySQL user has only SELECT/INSERT/UPDATE/DELETE (not SUPER/GRANT)
- [ ] Admin URL not linked from navigation (additional obscurity layer)
- [ ] Admin user password changed from seed default
- [ ] HTTPS enforced (Nginx HTTP → HTTPS redirect active)
- [ ] Rate limiting confirmed working (`curl -X POST /api/auth/login` 6× rapidly → 429)
- [ ] PayTR callback hash verification tested

---

## 8. Backups

```bash
# Daily MySQL backup cron (add to /etc/cron.d/)
0 3 * * * mysqldump -u USER -pPASSWORD niltellioglu | gzip > /backups/niltellioglu-$(date +\%Y\%m\%d).sql.gz
# Keep 30 days
find /backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

## 9. Monitoring

- `pm2 monit` — CPU/memory per process
- `sudo tail -f /var/log/nginx/error.log` — Nginx errors
- `pm2 logs guzellik-api` — Express logs

---

## Admin Credentials (Change After First Login!)
- URL: `/admin` (hidden from nav, protected by ADMIN role)
- Default email: `admin@guzellikmerkezi.com.tr`
- Default password: `Admin1234!` ← **Change immediately in production**
