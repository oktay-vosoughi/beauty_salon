import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Sunucu hatası"
      : (err.message ?? "Bilinmeyen hata");

  console.error(err);
  res.status(status).json({ error: message });
};
