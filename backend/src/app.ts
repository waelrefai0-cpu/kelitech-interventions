import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = new Set([env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]);
      const isLocalNetworkOrigin = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):(5173|5174)$/.test(origin);

      callback(null, allowedOrigins.has(origin) || isLocalNetworkOrigin);
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "kelitech-api" });
});

app.use("/api", apiRouter);

const frontendDistPath = [path.resolve(process.cwd(), "frontend", "dist"), path.resolve(process.cwd(), "..", "frontend", "dist")].find((candidate) =>
  fs.existsSync(path.join(candidate, "index.html")),
);
const frontendIndexPath = frontendDistPath ? path.join(frontendDistPath, "index.html") : "";

if (frontendDistPath && fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }

    res.sendFile(frontendIndexPath);
  });
}

app.use(notFound);
app.use(errorHandler);
