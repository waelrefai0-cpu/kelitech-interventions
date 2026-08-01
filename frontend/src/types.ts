export type Role = "USER" | "ADMIN" | "TECHNICIAN";

export type TicketStatus = string;
export type Priority = string;
export type ProblemType = string;
export type EquipmentType = "PC" | "PRINTER" | "SERVER" | "SWITCH" | "ROUTER" | "IP_CAMERA" | "OTHER";
export type EquipmentStatus = "IN_SERVICE" | "MAINTENANCE" | "OUT_OF_SERVICE" | "REFORMED" | "STOCK";
export type StockCategory = "TONER" | "CABLE" | "MOUSE" | "KEYBOARD" | "RAM" | "DISK" | "OTHER";

export interface Service {
  id: string;
  name: string;
  code: string;
  department?: Department | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  services?: Service[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string | null;
  serviceId?: string | null;
  service?: Service | null;
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  action: string;
  fromStatus?: TicketStatus | null;
  toStatus?: TicketStatus | null;
  message?: string | null;
  createdAt: string;
  createdBy?: User | null;
}

export interface Ticket {
  id: string;
  reference: string;
  title: string;
  description: string;
  problemType: ProblemType;
  priority: Priority;
  status: TicketStatus;
  diagnostic?: string | null;
  solution?: string | null;
  timeSpentMinutes?: number | null;
  isArchived: boolean;
  serviceId: string;
  service: Service;
  requesterId: string;
  requester: User;
  technicianId?: string | null;
  technician?: User | null;
  equipmentId?: string | null;
  equipment?: Equipment | null;
  attachments?: Attachment[];
  histories?: TicketHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  inventoryNumber: string;
  name: string;
  type: EquipmentType;
  brand?: string | null;
  model?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  system?: string | null;
  ram?: string | null;
  storage?: string | null;
  status: EquipmentStatus;
  acquisitionDate?: string | null;
  serviceId?: string | null;
  service?: Service | null;
  userId?: string | null;
  user?: User | null;
  notes?: string | null;
  tickets?: Ticket[];
  histories?: EquipmentHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentHistory {
  id: string;
  action: string;
  description?: string | null;
  createdAt: string;
  ticket?: Ticket | null;
  createdBy?: User | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  ticket?: Ticket | null;
  createdAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  status: TicketStatus;
  ticket?: Ticket | null;
  technician?: User | null;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  problemType: ProblemType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: User | null;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  location?: string | null;
  supplier?: string | null;
  isLowStock: boolean;
}

export type OptionCategory = "status" | "priority" | "problemType";

export interface AppOption {
  id: string;
  category: OptionCategory;
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}
