import type { EquipmentStatus, EquipmentType, Priority, ProblemType, Role, StockCategory, TicketStatus } from "../types";

export const roleLabels: Record<Role, string> = {
  USER: "Utilisateur",
  ADMIN: "Administrateur",
  TECHNICIAN: "Technicien",
};

export const statusLabels: Record<TicketStatus, string> = {
  NEW: "Nouveau",
  WAITING: "En attente",
  IN_PROGRESS: "En cours",
  WAITING_HARDWARE: "En attente materiel",
  RESOLVED: "Resolu",
  VALIDATED: "Valide",
  CLOSED: "Cloture",
  CANCELED: "Annule",
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Elevee",
  URGENT: "Urgente",
};

export const problemTypeLabels: Record<ProblemType, string> = {
  HARDWARE: "Materiel",
  SOFTWARE: "Logiciel",
  NETWORK: "Reseau",
  PRINTER: "Imprimante",
  SECURITY: "Securite",
  OTHER: "Autre",
};

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  PC: "PC",
  PRINTER: "Imprimante",
  SERVER: "Serveur",
  SWITCH: "Switch",
  ROUTER: "Routeur",
  IP_CAMERA: "Camera IP",
  OTHER: "Autre",
};

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  IN_SERVICE: "En service",
  MAINTENANCE: "En maintenance",
  OUT_OF_SERVICE: "Hors service",
  REFORMED: "Reforme",
  STOCK: "Stock",
};

export const stockCategoryLabels: Record<StockCategory, string> = {
  TONER: "Toner",
  CABLE: "Cable",
  MOUSE: "Souris",
  KEYBOARD: "Clavier",
  RAM: "RAM",
  DISK: "Disque",
  OTHER: "Autre",
};

export const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));
export const priorityOptions = Object.entries(priorityLabels).map(([value, label]) => ({ value, label }));
export const problemTypeOptions = Object.entries(problemTypeLabels).map(([value, label]) => ({ value, label }));
export const equipmentTypeOptions = Object.entries(equipmentTypeLabels).map(([value, label]) => ({ value, label }));
export const equipmentStatusOptions = Object.entries(equipmentStatusLabels).map(([value, label]) => ({ value, label }));
export const stockCategoryOptions = Object.entries(stockCategoryLabels).map(([value, label]) => ({ value, label }));

