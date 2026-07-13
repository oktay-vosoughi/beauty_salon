# Deploy Commands

Bu dosya VPS uzerinde deploy yaparken satir satir calistirilacak kisa komut listesidir.
Komutlari repo kok dizininde, yani `/var/www/guzellikmerkezi` altinda calistirin.

## Otomatik Deploy

Normal durumda sadece su komutlar yeterlidir:

```bash
cd /var/www/guzellikmerkezi
```

```bash
WEB_BASE_URL="https://ntbeauty.shop" bash deploy/deploy.sh
```

Kontrol:

```bash
pm2 status
```

```bash
pm2 logs guzellik-api --lines 30
```

```bash
pm2 logs guzellik-web --lines 30
```

## Manuel Deploy

Otomatik deploy scripti yarida kalirsa bu komutlari sirayla calistirin.
Her kod blogunu ayri ayri yapistirin; uzun komutlar bilerek degiskenlere bolunmustur.

```bash
cd /var/www/guzellikmerkezi
```

```bash
git fetch origin main
```

```bash
git merge --ff-only origin/main
```

```bash
pnpm install --frozen-lockfile
```

```bash
bash deploy/backup.sh
```

```bash
pnpm --filter @niltellioglu/api exec prisma generate
```

```bash
pnpm --filter @niltellioglu/api exec prisma migrate deploy
```

```bash
WEB_BASE_URL="https://ntbeauty.shop" pnpm --filter @niltellioglu/web build
```

```bash
SA=apps/web/.next/standalone/apps/web
```

```bash
mkdir -p "$SA/.next/static"
```

```bash
mkdir -p "$SA/public"
```

```bash
SRC_STATIC=apps/web/.next/static/.
```

```bash
DST_STATIC="$SA/.next/static/"
```

```bash
cp -r "$SRC_STATIC" "$DST_STATIC"
```

```bash
SRC_PUBLIC=apps/web/public/.
```

```bash
DST_PUBLIC="$SA/public/"
```

```bash
cp -r "$SRC_PUBLIC" "$DST_PUBLIC"
```

```bash
pm2 restart guzellik-api guzellik-web
```

```bash
pm2 save
```

## Deploy Sonrasi Kontrol

```bash
pm2 status
```

```bash
curl -I https://ntbeauty.shop
```

```bash
curl -I https://ntbeauty.shop/api/health
```

```bash
pm2 logs guzellik-api --lines 50
```

```bash
pm2 logs guzellik-web --lines 50
```

Admin panelden bir urun gorseli yukleyip urun sayfasinda gorselin acildigini kontrol edin.

## Backup Hatasi Olursa

`mysqldump` su hatayi verirse:

```text
Access denied; you need (at least one of) the PROCESS privilege(s)
```

`deploy/backup.sh` icindeki `mysqldump` komutu su sekilde olmalidir:

```bash
mysqldump --defaults-extra-file="$CNF_TMP" \
  --single-transaction --quick --routines --triggers --no-tablespaces "$dbname" | gzip > "$out"
```

Bu satir duzeltildikten sonra backup'i tekrar deneyin:

```bash
bash deploy/backup.sh
```
