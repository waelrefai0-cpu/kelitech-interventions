import { Router } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole(Role.ADMIN, Role.TECHNICIAN));

reportsRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [byService, byType, byPriority, byTechnician, resolved] = await prisma.$transaction([
      prisma.ticket.groupBy({ by: ["serviceId"], _count: true, orderBy: { serviceId: "asc" } }),
      prisma.ticket.groupBy({ by: ["problemType"], _count: true, orderBy: { problemType: "asc" } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: true, orderBy: { priority: "asc" } }),
      prisma.ticket.groupBy({
        by: ["technicianId"],
        _count: true,
        where: { technicianId: { not: null } },
        orderBy: { technicianId: "asc" },
      }),
      prisma.ticket.aggregate({ where: { resolvedAt: { not: null } }, _avg: { timeSpentMinutes: true } }),
    ]);

    const [services, technicians] = await Promise.all([
      prisma.service.findMany({ where: { id: { in: byService.map((entry) => entry.serviceId) } } }),
      prisma.user.findMany({
        where: { id: { in: byTechnician.map((entry) => entry.technicianId!).filter(Boolean) } },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);

    res.json({
      byService: byService.map((entry) => ({
        service: services.find((service) => service.id === entry.serviceId)?.name ?? "Service",
        count: entry._count,
      })),
      byType: byType.map((entry) => ({ problemType: entry.problemType, count: entry._count })),
      byPriority: byPriority.map((entry) => ({ priority: entry.priority, count: entry._count })),
      byTechnician: byTechnician.map((entry) => {
        const technician = technicians.find((item) => item.id === entry.technicianId);
        return {
          technician: technician ? `${technician.firstName} ${technician.lastName}` : "Non affecte",
          count: entry._count,
        };
      }),
      averageResolutionMinutes: Math.round(resolved._avg.timeSpentMinutes ?? 0),
    });
  }),
);

reportsRouter.get(
  "/tickets.xlsx",
  asyncHandler(async (req, res) => {
    const tickets = await prisma.ticket.findMany({
      include: {
        service: true,
        requester: true,
        technician: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KeliTech";
    const sheet = workbook.addWorksheet("Tickets");
    sheet.columns = [
      { header: "Reference", key: "reference", width: 18 },
      { header: "Titre", key: "title", width: 30 },
      { header: "Service", key: "service", width: 20 },
      { header: "Demandeur", key: "requester", width: 24 },
      { header: "Technicien", key: "technician", width: 24 },
      { header: "Type", key: "problemType", width: 18 },
      { header: "Priorite", key: "priority", width: 14 },
      { header: "Statut", key: "status", width: 18 },
      { header: "Temps passe (min)", key: "timeSpentMinutes", width: 18 },
      { header: "Cree le", key: "createdAt", width: 20 },
    ];

    tickets.forEach((ticket) => {
      sheet.addRow({
        reference: ticket.reference,
        title: ticket.title,
        service: ticket.service.name,
        requester: `${ticket.requester.firstName} ${ticket.requester.lastName}`,
        technician: ticket.technician ? `${ticket.technician.firstName} ${ticket.technician.lastName}` : "",
        problemType: ticket.problemType,
        priority: ticket.priority,
        status: ticket.status,
        timeSpentMinutes: ticket.timeSpentMinutes ?? 0,
        createdAt: format(ticket.createdAt, "dd/MM/yyyy HH:mm"),
      });
    });

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    sheet.autoFilter = "A1:J1";

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=tickets-${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  }),
);

reportsRouter.get(
  "/monthly.pdf",
  asyncHandler(async (req, res) => {
    const month = req.query.month ? Number(req.query.month) - 1 : new Date().getMonth();
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const [tickets, totals] = await Promise.all([
      prisma.ticket.findMany({
        where: { createdAt: { gte: start, lt: end } },
        include: { service: true, technician: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.ticket.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lt: end } },
        _count: true,
      }),
    ]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=rapport-${year}-${month + 1}.pdf`);

    const doc = new PDFDocument({ margin: 48, size: "A4" });
    doc.pipe(res);
    doc.fontSize(18).text("Rapport mensuel des interventions informatiques", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Municipalite de Kelibia - ${format(start, "MMMM yyyy", { locale: fr })}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(13).text("Synthese", { underline: true });
    doc.moveDown(0.5);
    totals.forEach((entry) => {
      doc.fontSize(10).text(`${entry.status}: ${entry._count}`);
    });

    doc.moveDown(1);
    doc.fontSize(13).text("Tickets du mois", { underline: true });
    doc.moveDown(0.5);

    tickets.forEach((ticket) => {
      doc
        .fontSize(10)
        .text(`${ticket.reference} | ${ticket.title}`, { continued: false })
        .fontSize(9)
        .fillColor("#475569")
        .text(
          `${ticket.service.name} - ${ticket.priority} - ${ticket.status} - ${format(ticket.createdAt, "dd/MM/yyyy")}`,
        )
        .fillColor("#111827")
        .moveDown(0.5);
    });

    if (tickets.length === 0) {
      doc.fontSize(10).text("Aucun ticket sur cette periode.");
    }

    doc.end();
  }),
);
