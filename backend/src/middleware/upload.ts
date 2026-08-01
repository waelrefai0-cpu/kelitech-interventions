import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const base = path.basename(file.originalname, extension).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
    cb(null, `${Date.now()}-${base}${extension}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      cb(new HttpError(415, "Type de fichier non autorise"));
      return;
    }
    cb(null, true);
  },
});

