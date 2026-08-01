import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const optionsRouter = Router();

const defaultOptions = [
  ...Object.entries({
    NEW: "Nouveau",
    WAITING: "En attente",
    IN_PROGRESS: "En cours",
    WAITING_HARDWARE: "En attente materiel",
    RESOLVED: "Resolu",
    VALIDATED: "Valide",
    CLOSED: "Cloture",
    CANCELED: "Annule",
  }).map(([value, label], index) => ({ category: "status", value, label, sortOrder: index })),
  ...Object.entries({
    LOW: "Faible",
    MEDIUM: "Moyenne",
    HIGH: "Elevee",
    URGENT: "Urgente",
  }).map(([value, label], index) => ({ category: "priority", value, label, sortOrder: index })),
  ...Object.entries({
    HARDWARE: "Materiel",
    SOFTWARE: "Logiciel",
    NETWORK: "Reseau",
    PRINTER: "Imprimante",
    SECURITY: "Securite",
    OTHER: "Autre",
  }).map(([value, label], index) => ({ category: "problemType", value, label, sortOrder: index })),
];

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const createSchema = z.object({
  category: z.enum(["status", "priority", "problemType"]),
  label: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

function slugifyOption(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

async function ensureDefaultOptions() {
  await Promise.all(
    defaultOptions.map((option) =>
      prisma.appOption.upsert({
        where: { category_value: { category: option.category, value: option.value } },
        update: {},
        create: option,
      }),
    ),
  );
}

optionsRouter.use(requireAuth);

optionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await ensureDefaultOptions();
    const options = await prisma.appOption.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });
    res.json(options);
  }),
);

optionsRouter.patch(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = updateSchema.parse(req.body);
    const option = await prisma.appOption.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(option);
  }),
);

optionsRouter.post(
  "/",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const baseValue = slugifyOption(payload.label);
    const value = baseValue || `OPTION_${Date.now()}`;

    const option = await prisma.appOption.create({
      data: {
        category: payload.category,
        value,
        label: payload.label,
        sortOrder: payload.sortOrder ?? 99,
      },
    });

    res.status(201).json(option);
  }),
);

optionsRouter.delete(
  "/:id",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.appOption.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
