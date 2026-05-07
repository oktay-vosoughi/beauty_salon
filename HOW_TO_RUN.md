# How to Run — Beauty Salon Turkish E-commerce

Quick reference for starting, stopping, and testing the project locally on Windows (PowerShell).

---

## 1. Prerequisites (one-time)

- **Node.js ≥ 20** — https://nodejs.org
- **pnpm ≥ 9** — install with:
  ```powershell
  npm install -g pnpm
  ```
- **MySQL 8.0+** running on `localhost:3306`
- Database `niltellioglu` exists (the migration creates the tables)

### Make `pnpm` available in every new PowerShell window

If `pnpm` is "not recognized" in new terminals, add npm's global folder to your user PATH **once**:

```powershell
$npmPrefix = npm config get prefix
[Environment]::SetEnvironmentVariable(
  "Path",
  "$npmPrefix;" + [Environment]::GetEnvironmentVariable("Path","User"),
  "User"
)
```

Then **close and reopen** the terminal.

Per-session fallback (no permanent change):
```powershell
$env:Path = "$(npm config get prefix);$env:Path"
```

---

## 2. Environment files

Two `.env` files are required (same content):

- `c:\Users\STREAM\Desktop\niltellioglu\.env` — used by the runtime
- `c:\Users\STREAM\Desktop\niltellioglu\apps\api\.env` — used by the Prisma CLI

If you change DB credentials or PayTR keys, **update both**.

To recreate the API copy from the root:
```powershell
Copy-Item "C:\Users\STREAM\Desktop\niltellioglu\.env" "C:\Users\STREAM\Desktop\niltellioglu\apps\api\.env" -Force
```

Required keys:
```
DATABASE_URL="mysql://root:0000@localhost:3306/niltellioglu"
SESSION_SECRET="..."
PAYTR_MERCHANT_ID=""
PAYTR_MERCHANT_KEY=""
PAYTR_MERCHANT_SALT=""
PAYTR_TEST_MODE="1"
WEB_BASE_URL="http://localhost:3000"
API_BASE_URL="http://localhost:4000"
```

---

## 3. First-time database setup

From the repo root:

```powershell
pnpm install
pnpm --filter @niltellioglu/api run db:generate
pnpm --filter @niltellioglu/api run db:migrate
pnpm --filter @niltellioglu/api run db:seed
```

This creates 5 categories, 25 products, and 1 admin user.

**Admin login:**
- Email: `admin@guzellikmerkezi.com.tr`
- Password: `Admin1234!`

---

## 4. Start the project (backend + frontend)

From the repo root `c:\Users\STREAM\Desktop\niltellioglu`:

```powershell
pnpm dev
```

This starts **both** apps in parallel:
- **Backend API:** http://localhost:4000
- **Frontend Web:** http://localhost:3000

Wait until you see:
```
apps/api dev: API listening on http://localhost:4000
apps/web dev:  ✓ Ready in 2.8s
```

### Open in Chrome

Open http://localhost:3000 manually, or from PowerShell:
```powershell
Start-Process "chrome.exe" "http://localhost:3000"
```

### Run apps separately (two terminals)

Terminal 1 — Backend:
```powershell
pnpm --filter @niltellioglu/api dev
```

Terminal 2 — Frontend:
```powershell
pnpm --filter @niltellioglu/web dev
```

---

## 5. Stop the project

In the terminal running `pnpm dev`, press **Ctrl + C**.

If processes get stuck or ports stay in use:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Check what's using a port:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

---

## 6. Useful URLs

| Page | URL |
|---|---|
| Ana Sayfa | http://localhost:3000 |
| Ürünler | http://localhost:3000/urunler |
| İletişim | http://localhost:3000/iletisim |
| Giriş | http://localhost:3000/giris |
| Kayıt | http://localhost:3000/kayit |
| Sepet | http://localhost:3000/sepet |
| Hesabım | http://localhost:3000/hesabim |
| Admin paneli | http://localhost:3000/admin |
| API health | http://localhost:4000/api/health |
| API products | http://localhost:4000/api/products |

---

## 7. Database tools

GUI for inspecting/editing data:
```powershell
pnpm --filter @niltellioglu/api run db:studio
```
Opens Prisma Studio at http://localhost:5555.

Re-run seed (resets seeded rows):
```powershell
pnpm --filter @niltellioglu/api run db:seed
```

---

## 8. Tests

```powershell
# Backend unit + integration tests (Vitest + Supertest)
pnpm --filter @niltellioglu/api run test

# End-to-end browser tests (Playwright) — needs both servers running
pnpm test:e2e

# Type checking + linting
pnpm typecheck
pnpm lint

# Production build sanity
pnpm build
```

---

## 9. PayTR payment testing

The full payment flow needs real PayTR test credentials:

1. Get test merchant ID/key/salt from the PayTR developer panel.
2. Fill `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` in **both** `.env` files.
3. Keep `PAYTR_TEST_MODE="1"`.
4. PayTR's callback hits `POST /api/payments/paytr/callback`. For local tests expose port 4000 with a tunnel, e.g.:
   ```powershell
   ngrok http 4000
   ```
   Register the ngrok URL in the PayTR panel as the callback.

All other flows (browse, cart, orders, admin, reviews) work without PayTR.

---

## 10. Common issues

| Symptom | Fix |
|---|---|
| `pnpm: not recognized` | Run the PATH command from section 1, then reopen terminal |
| `EPERM ... query_engine-windows.dll.node` | A node process is holding the file. Run `Get-Process node \| Stop-Process -Force` then retry |
| `Environment variable not found: DATABASE_URL` (Prisma) | Missing `apps/api/.env`. Run the `Copy-Item` from section 2 |
| Port 3000 or 4000 already in use | `Get-Process node \| Stop-Process -Force` or find PID via `netstat -ano \| findstr :3000` and `Stop-Process -Id <PID>` |
| `pnpm install` asks to remove `node_modules` | Answering No is fine if deps haven't changed; the existing `node_modules` works |
| MySQL connection refused | Confirm MySQL service is running and credentials in `.env` match (`root` / `0000` by default) |

---

## 11. Project layout (quick reference)

```
niltellioglu/
├── apps/
│   ├── api/        Express + Prisma + MySQL (port 4000)
│   └── web/        Next.js 14 (port 3000)
├── packages/
│   └── shared/     Zod schemas + shared types
├── energen-master/ Read-only HTML/CSS source template
├── deploy/         Nginx + deployment guide
├── ecosystem.config.js  PM2 config (production)
├── .env            Runtime env (root)
└── apps/api/.env   Prisma CLI env (must match root)
```

For full feature status see `DEVELOPMENT_STATUS.md` and `TASKS.md`.
