import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRole(Role.ADMIN, Role.TECHNICIAN));

dashboardRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTickets,
      waitingTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      activeTechnicians,
      lowStock,
      averageResolved,
      byStatus,
      byPriority,
      byType,
      byService,
      recentTickets,
    ] = await prisma.$transaction([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ["NEW", "WAITING", "WAITING_HARDWARE"] } } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: { in: ["RESOLVED", "VALIDATED", "CLOSED"] } } }),
      prisma.ticket.count({ where: { priority: "URGENT", status: { notIn: ["CLOSED", "CANCELED"] } } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.stockItem.count({ where: { quantity: { lte: prisma.stockItem.fields.minimumQuantity } } }),
      prisma.ticket.aggregate({
        where: { resolvedAt: { not: null }, createdAt: { gte: startOfMonth } },
        _avg: { timeSpentMinutes: true },
      }),
      prisma.ticket.groupBy({ by: ["status"], _count: true, orderBy: { status: "asc" } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: true, orderBy: { priority: "asc" } }),
      prisma.ticket.groupBy({ by: ["problemType"], _count: true, orderBy: { problemType: "asc" } }),
      prisma.ticket.groupBy({ by: ["serviceId"], _count: true, orderBy: { serviceId: "asc" } }),
      prisma.ticket.findMany({
        take: 6,
        include: { service: true, requester: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const services = await prisma.service.findMany({
      where: { id: { in: byService.map((entry) => entry.serviceId) } },
    });

    const serviceNames = Object.fromEntries(services.map((service) => [service.id, service.name]));

    res.json({
      totals: {
        totalTickets,
        waitingTickets,
        inProgressTickets,
        resolvedTickets,
        urgentTickets,
        activeTechnicians,
        lowStock,
        averageTimeSpentMinutes: Math.round(averageResolved._avg.timeSpentMinutes ?? 0),
      },
      byStatus: byStatus.map((entry) => ({ status: entry.status, count: entry._count })),
      byPriority: byPriority.map((entry) => ({ priority: entry.priority, count: entry._count })),
      byType: byType.map((entry) => ({ problemType: entry.problemType, count: entry._count })),
      byService: byService.map((entry) => ({
        serviceId: entry.serviceId,
        service: serviceNames[entry.serviceId] ?? "Service",
        count: entry._count,
      })),
      recentTickets,
    });
  }),
);
