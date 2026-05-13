import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import path from "path";
import { sessionMiddleware } from "./middleware/session";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import productsRouter from "./routes/products";
import categoriesRouter from "./routes/categories";
import cartRouter from "./routes/cart";
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import reviewsRouter from "./routes/reviews";
import contactRouter from "./routes/contact";
import adminProductsRouter from "./routes/admin/products";
import adminOrdersRouter from "./routes/admin/orders";
import adminReviewsRouter from "./routes/admin/reviews";
import adminUploadsRouter from "./routes/admin/uploads";
import adminShipmentsRouter from "./routes/admin/shipments";
import { requireAdmin } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

const app = express();

app.set("trust proxy", 1);

// Gzip compress all responses (JSON APIs, HTML etc.) except already-compressed images.
app.use(compression({
  filter: (req, res) => {
    const ct = res.getHeader("Content-Type");
    if (typeof ct === "string" && /^image\//i.test(ct)) return false;
    return compression.filter(req, res);
  },
}));

app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Serve uploaded product images. UUID-based filenames are immutable so we cache for 1 year.
// In production with Nginx, configure Nginx to serve /uploads directly from disk to skip this hop.
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    fallthrough: true,
    maxAge: "365d",
    immutable: true,
    index: false,
  })
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/contact", contactRouter);

// Admin routes — all require ADMIN role
app.use("/api/admin/products", requireAdmin, adminProductsRouter);
app.use("/api/admin/orders", requireAdmin, adminOrdersRouter);
app.use("/api/admin/orders/:orderId/shipment", requireAdmin, adminShipmentsRouter);
app.use("/api/admin/reviews", requireAdmin, adminReviewsRouter);
app.use("/api/admin/uploads", requireAdmin, adminUploadsRouter);

app.use(errorHandler);

export default app;
