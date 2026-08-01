import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const servicesRouter = Router();

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(12).transform((value) => value.toUpperCase()),
});

const serviceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(12).transform((value) => value.toUpperCase()),
  departmentId: z.string().uuid().optional().nullable(),
});

servicesRouter.use(requireAuth);

servicesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const services = await prisma.service.findMany({
      include: { department: true },
      orderBy: { name: "asc" },
    });

    res.json(services);
  }),
);

servicesRouter.post(
  "/",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = serviceSchema.parse(req.body);
    const service = await prisma.service.create({ data: payload, include: { department: true } });
    res.status(201).json(service);
  }),
);

servicesRouter.patch(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: payload,
      include: { department: true },
    });
    res.json(service);
  }),
);

servicesRouter.delete(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

servicesRouter.get(
  "/departments/list",
  asyncHandler(async (_req, res) => {
    const departments = await prisma.department.findMany({
      include: { services: true },
      orderBy: { name: "asc" },
    });

    res.json(departments);
  }),
);

servicesRouter.post(
  "/departments",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = departmentSchema.parse(req.body);
    const department = await prisma.department.create({ data: payload });
    res.status(201).json(department);
  }),
);

servicesRouter.patch(
  "/departments/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = departmentSchema.partial().parse(req.body);
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(department);
  }),
);

servicesRouter.delete(
  "/departments/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

