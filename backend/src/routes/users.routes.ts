import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { sanitizeUser } from "../utils/serializers.js";

export const usersRouter = Router();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role),
  phone: z.string().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
});

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: req.query.role ? { role: req.query.role as Role } : undefined,
      include: { service: true },
      orderBy: [{ role: "asc" }, { lastName: "asc" }],
    });

    res.json(users.map(sanitizeUser));
  }),
);

usersRouter.get(
  "/technicians",
  requireRole(Role.ADMIN, Role.TECHNICIAN),
  asyncHandler(async (_req, res) => {
    const technicians = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      include: { service: true },
      orderBy: { lastName: "asc" },
    });

    res.json(technicians.map(sanitizeUser));
  }),
);

usersRouter.post(
  "/",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = userSchema.extend({ password: z.string().min(8) }).parse(req.body);

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        passwordHash,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        phone: payload.phone,
        serviceId: payload.serviceId,
      },
    });

    res.status(201).json(sanitizeUser(user));
  }),
);

usersRouter.patch(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = userSchema.partial().parse(req.body);

    const data: Record<string, unknown> = {
      ...payload,
      email: payload.email?.toLowerCase(),
    };

    if (payload.password) {
      data.passwordHash = await bcrypt.hash(payload.password, 10);
      delete data.password;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });

    res.json(sanitizeUser(user));
  }),
);

usersRouter.delete(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw new HttpError(400, "Vous ne pouvez pas supprimer votre propre compte");
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
