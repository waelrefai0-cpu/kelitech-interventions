import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { HttpError } from "../utils/http-error.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new HttpError(401, "Authentification requise");
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new HttpError(401, "Token invalide ou expire");
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, "Authentification requise");
    }

    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "Acces refuse pour ce role");
    }

    next();
  };
}

