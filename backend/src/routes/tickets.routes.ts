import { Router } from "express";
import type { Request } from "express";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { generateTicketReference } from "../utils/ticket-reference.js";

export const ticketsRouter = Router();

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  phone: true,
  serviceId: true,
} satisfies Prisma.UserSelect;

const ticketInclude = {
  service: true,
  requester: { select: userSelect },
  technician: { select: userSelect },
  equipment: true,
  attachments: true,
  histories: {
    include: {
      createdBy: { select: userSelect },
    },
    orderBy: { createdAt: "desc" as const },
  },
  schedules: true,
};

const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  serviceId: z.string().uuid(),
  problemType: z.string().min(1),
  priority: z.string().min(1),
  equipmentId: z.string().uuid().optional().nullable(),
  requesterId: z.string().uuid().optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  serviceId: z.string().uuid().optional(),
  problemType: z.string().min(1).optional(),
  priority: z.string().min(1).optional(),
  equipmentId: z.string().uuid().optional().nullable(),
  diagnostic: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  timeSpentMinutes: z.coerce.number().int().min(0).optional().nullable(),
  isArchived: z.coerce.boolean().optional(),
});

const statusSchema = z.object({
  status: z.string().min(1),
  message: z.string().optional(),
  diagnostic: z.string().optional(),
  solution: z.string().optional(),
  timeSpentMinutes: z.coerce.number().int().min(0).optional(),
});

function buildTicketWhere(req: Request): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (req.user?.role === Role.USER) {
    where.requesterId = req.user.id;
  }

  if (req.query.status) where.status = String(req.query.status);
  if (req.query.priority) where.priority = String(req.query.priority);
  if (req.query.serviceId) where.serviceId = String(req.query.serviceId);
  if (req.query.problemType) where.problemType = String(req.query.problemType);
  if (req.query.requesterId && req.user?.role !== Role.USER) where.requesterId = String(req.query.requesterId);
  if (req.query.technicianId && req.user?.role !== Role.USER) where.technicianId = String(req.query.technicianId);
  if (req.query.archived !== undefined) where.isArchived = String(req.query.archived) === "true";

  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { requester: { firstName: { contains: q, mode: "insensitive" } } },
      { requester: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {
      gte: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
      lte: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
    };
  }

  return where;
}

async function createTicketNotification(ticketId: string, title: string, message: string) {
  const recipients = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  });

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      ticketId,
      type: "TICKET_CREATED",
      title,
      message,
    })),
  });
}

ticketsRouter.use(requireAuth);

ticketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
    const where = buildTicketWhere(req);

    const [items, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        include: ticketInclude,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  }),
);

ticketsRouter.get(
  "/waiting-list",
  asyncHandler(async (_req, res) => {
    const tickets = await prisma.ticket.findMany({
      where: {
        isArchived: false,
        status: { in: ["NEW", "WAITING", "WAITING_HARDWARE"] },
      },
      include: ticketInclude,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    res.json(tickets);
  }),
);

ticketsRouter.post(
  "/",
  upload.array("attachments", 5),
  asyncHandler(async (req, res) => {
    const payload = createTicketSchema.parse(req.body);
    const requesterId = req.user!.role === Role.USER ? req.user!.id : payload.requesterId ?? req.user!.id;
    const reference = await generateTicketReference();
    const files = (req.files ?? []) as Express.Multer.File[];

    const ticket = await prisma.ticket.create({
      data: {
        reference,
        title: payload.title,
        description: payload.description,
        problemType: payload.problemType,
        priority: payload.priority,
        serviceId: payload.serviceId,
        requesterId,
        equipmentId: payload.equipmentId,
        histories: {
          create: {
            action: "CREATED",
            toStatus: "NEW",
            message: "Ticket cree",
            createdById: req.user!.id,
          },
        },
        attachments:
          files.length > 0
            ? {
                create: files.map((file) => ({
                  filename: file.filename,
                  originalName: file.originalname,
                  mimeType: file.mimetype,
                  size: file.size,
                  path: `/uploads/${file.filename}`,
                  uploadedById: req.user!.id,
                })),
              }
            : undefined,
      },
      include: ticketInclude,
    });

    await createTicketNotification(ticket.id, "Nouveau ticket", `${ticket.reference} - ${ticket.title}`);
    res.status(201).json(ticket);
  }),
);

ticketsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: ticketInclude,
    });

    if (!ticket) throw new HttpError(404, "Ticket introuvable");
    if (req.user!.role === Role.USER && ticket.requesterId !== req.user!.id) {
      throw new HttpError(403, "Acces refuse a ce ticket");
    }

    res.json(ticket);
  }),
);

ticketsRouter.patch(
  "/:id",
  requireRole(Role.ADMIN, Role.TECHNICIAN),
  asyncHandler(async (req, res) => {
    const payload = updateTicketSchema.parse(req.body);
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        ...payload,
        archivedAt: payload.isArchived ? new Date() : undefined,
      },
      include: ticketInclude,
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        action: "UPDATED",
        message: "Ticket mis a jour",
        createdById: req.user!.id,
        metadata: payload,
      },
    });

    res.json(ticket);
  }),
);

ticketsRouter.patch(
  "/:id/status",
  requireRole(Role.ADMIN, Role.TECHNICIAN),
  asyncHandler(async (req, res) => {
    const payload = statusSchema.parse(req.body);
    const current = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, "Ticket introuvable");

    const statusDates: Prisma.TicketUpdateInput = {};
    if (payload.status === "RESOLVED") statusDates.resolvedAt = new Date();
    if (payload.status === "CLOSED") statusDates.closedAt = new Date();

    const ticket = await prisma.ticket.update({
      where: { id: current.id },
      data: {
        status: payload.status,
        diagnostic: payload.diagnostic ?? current.diagnostic,
        solution: payload.solution ?? current.solution,
        timeSpentMinutes: payload.timeSpentMinutes ?? current.timeSpentMinutes,
        ...statusDates,
      },
      include: ticketInclude,
    });

    await prisma.$transaction([
      prisma.ticketHistory.create({
        data: {
          ticketId: current.id,
          action: "STATUS_CHANGED",
          fromStatus: current.status,
          toStatus: payload.status,
          message: payload.message ?? "Statut modifie",
          createdById: req.user!.id,
        },
      }),
      prisma.notification.create({
        data: {
          type: "STATUS_CHANGED",
          title: "Statut modifie",
          message: `${current.reference} est maintenant ${payload.status}`,
          userId: current.requesterId,
          ticketId: current.id,
        },
      }),
    ]);

    res.json(ticket);
  }),
);

ticketsRouter.patch(
  "/:id/assign",
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const payload = z.object({ technicianId: z.string().uuid().nullable() }).parse(req.body);
    const current = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, "Ticket introuvable");

    if (payload.technicianId) {
      const technician = await prisma.user.findUnique({ where: { id: payload.technicianId } });
      if (!technician || technician.role !== Role.ADMIN) {
        throw new HttpError(422, "Technicien invalide");
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: current.id },
      data: {
        technicianId: payload.technicianId,
        status: payload.technicianId && current.status === "NEW" ? "WAITING" : current.status,
      },
      include: ticketInclude,
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: current.id,
        action: "ASSIGNED",
        message: payload.technicianId ? "Ticket affecte a un technicien" : "Affectation retiree",
        createdById: req.user!.id,
        metadata: payload,
      },
    });

    if (payload.technicianId) {
      await prisma.notification.create({
        data: {
          type: "TICKET_ASSIGNED",
          title: "Ticket affecte",
          message: `${current.reference} vous a ete affecte`,
          userId: payload.technicianId,
          ticketId: current.id,
        },
      });
    }

    res.json(ticket);
  }),
);

ticketsRouter.post(
  "/:id/attachments",
  upload.array("attachments", 5),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new HttpError(404, "Ticket introuvable");
    if (req.user!.role === Role.USER && ticket.requesterId !== req.user!.id) {
      throw new HttpError(403, "Acces refuse a ce ticket");
    }

    const files = (req.files ?? []) as Express.Multer.File[];
    const attachments = await prisma.attachment.createMany({
      data: files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`,
        ticketId: ticket.id,
        uploadedById: req.user!.id,
      })),
    });

    res.status(201).json(attachments);
  }),
);
