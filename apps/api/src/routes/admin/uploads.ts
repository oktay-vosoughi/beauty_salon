import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import sharp from "sharp";

const router = Router();

// Write uploads directly into the Next.js web app's public folder so they're
// served without a Node proxy hop. Falls back to local uploads/ if env unset.
const UPLOAD_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "..", "web", "public", "uploads");
const PRODUCT_DIR = path.join(UPLOAD_ROOT, "products");
fs.mkdirSync(PRODUCT_DIR, { recursive: true });

const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024; // raw admin upload
const MAX_OPTIMIZED_IMAGE_BYTES = 5 * 1024 * 1024; // stored product image
const PRODUCT_IMAGE_MAX_DIMENSION = 1600;
const WEBP_QUALITIES = [88, 84, 80, 76] as const;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

function hasImageSignature(buffer: Buffer, mimetype: string) {
  switch (mimetype) {
    case "image/jpeg":
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "image/avif":
      return (
        buffer.length >= 12 &&
        buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
        ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))
      );
    case "image/gif":
      return (
        buffer.length >= 6 &&
        ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
      );
    default:
      return false;
  }
}

async function isValidImageFile(filePath: string, mimetype: string) {
  const file = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return hasImageSignature(buffer.subarray(0, bytesRead), mimetype);
  } finally {
    await file.close();
  }
}

async function optimizeProductImage(sourcePath: string, destinationPath: string) {
  const parsed = path.parse(destinationPath);
  let lastSize = 0;

  for (const quality of WEBP_QUALITIES) {
    const tempPath = path.join(PRODUCT_DIR, `${parsed.name}-${randomUUID()}.tmp.webp`);

    try {
      await sharp(sourcePath)
        .rotate()
        .resize({
          width: PRODUCT_IMAGE_MAX_DIMENSION,
          height: PRODUCT_IMAGE_MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toFile(tempPath);

      const stats = await fs.promises.stat(tempPath);
      lastSize = stats.size;

      if (stats.size <= MAX_OPTIMIZED_IMAGE_BYTES) {
        await fs.promises.rm(destinationPath, { force: true });
        await fs.promises.rename(tempPath, destinationPath);
        return { size: stats.size, quality };
      }
    } finally {
      await fs.promises.rm(tempPath, { force: true }).catch(() => {});
    }
  }

  const err = new Error("OPTIMIZED_FILE_TOO_LARGE");
  (err as Error & { lastSize?: number }).lastSize = lastSize;
  throw err;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCT_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const safeExt = /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : ".bin";
    cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SOURCE_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) cb(null, true);
    else cb(new Error("UNSUPPORTED_FILE_TYPE"));
  },
});

router.post("/", (req, res, next) => {
  upload.single("file")(req, res, async (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : "Yükleme başarısız.";
      const code = msg === "UNSUPPORTED_FILE_TYPE" ? 415 : 400;
      const human =
        msg === "UNSUPPORTED_FILE_TYPE"
          ? "Desteklenmeyen dosya türü. Sadece JPG/PNG/WEBP/AVIF/GIF kabul edilir."
          : msg.includes("File too large")
          ? "Dosya çok büyük (en fazla 25 MB)."
          : "Yükleme başarısız.";
      res.status(code).json({ error: human });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Dosya bulunamadı." });
      return;
    }

    try {
      const validImage = await isValidImageFile(req.file.path, req.file.mimetype);
      if (!validImage) {
        await fs.promises.rm(req.file.path, { force: true });
        res.status(415).json({ error: "Dosya geçerli bir görsel değil." });
        return;
      }
    } catch (validationErr) {
      await fs.promises.rm(req.file.path, { force: true }).catch(() => {});
      next(validationErr);
      return;
    }

    // Convert and resize to WebP (max 1200×1200, quality 85) to save bandwidth.
    // GIFs are served as-is to preserve animation.
    if (req.file.mimetype !== "image/gif") {
      try {
        const parsedName = path.parse(req.file.filename);
        const webpFilename = `${parsedName.name}.webp`;
        const webpPath = path.join(PRODUCT_DIR, webpFilename);

        const optimized = await optimizeProductImage(req.file.path, webpPath);

        if (req.file.filename !== webpFilename) {
          await fs.promises.rm(req.file.path, { force: true });
        }

        // Generate a tiny 10×10 WebP for blur-up placeholder (≈ 100–200 bytes).
        const blurBuffer = await sharp(webpPath)
          .resize(10, 10, { fit: "cover" })
          .webp({ quality: 20 })
          .toBuffer();
        const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

        const url = `/uploads/products/${webpFilename}`;
        res.status(201).json({
          url,
          filename: webpFilename,
          size: optimized.size,
          mimetype: "image/webp",
          blurDataUrl,
        });
        return;
      } catch (sharpErr) {
        await fs.promises.rm(req.file.path, { force: true }).catch(() => {});
        if (sharpErr instanceof Error && sharpErr.message === "OPTIMIZED_FILE_TOO_LARGE") {
          res.status(400).json({
            error: "Görsel optimize edildikten sonra bile 5 MB üstünde kaldı. Lütfen daha küçük bir görsel deneyin.",
          });
          return;
        }
        next(sharpErr);
        return;
      }
    }

    const url = `/uploads/products/${req.file.filename}`;
    res.status(201).json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
  // pass next so eslint no-unused stays happy in some setups
  void next;
});

router.delete("/:filename", (req, res) => {
  const raw = req.params.filename;
  // Reject path traversal — accept only basenames matching our generated pattern.
  const base = path.basename(raw);
  if (base !== raw || !/^[A-Za-z0-9._-]+$/.test(base)) {
    res.status(400).json({ error: "Geçersiz dosya adı." });
    return;
  }
  const filePath = path.join(PRODUCT_DIR, base);
  // Defense-in-depth: ensure resolved path is still inside PRODUCT_DIR.
  if (!filePath.startsWith(PRODUCT_DIR + path.sep) && filePath !== PRODUCT_DIR) {
    res.status(400).json({ error: "Geçersiz yol." });
    return;
  }
  fs.unlink(filePath, (err) => {
    if (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        res.json({ ok: true, alreadyMissing: true });
        return;
      }
      res.status(500).json({ error: "Dosya silinemedi." });
      return;
    }
    res.json({ ok: true });
  });
});

export default router;
export { hasImageSignature, PRODUCT_DIR, UPLOAD_ROOT };
