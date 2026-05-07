import express from "express";
import helmet from "helmet";
import cors from "cors";
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
import { requireAdmin } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

const app = express();

app.set("trust proxy", 1);

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
app.use("/api/admin/reviews", requireAdmin, adminReviewsRouter);

app.use(errorHandler);

export default app;
