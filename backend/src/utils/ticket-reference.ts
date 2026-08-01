import { prisma } from "../config/prisma.js";

export async function generateTicketReference() {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });

  return `INT-${year}-${String(count + 1).padStart(5, "0")}`;
}

