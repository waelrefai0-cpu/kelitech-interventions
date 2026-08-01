import {
  EquipmentStatus,
  EquipmentType,
  PrismaClient,
  Role,
  StockCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

const ProblemType = {
  HARDWARE: "HARDWARE",
  SOFTWARE: "SOFTWARE",
  NETWORK: "NETWORK",
  PRINTER: "PRINTER",
  SECURITY: "SECURITY",
  OTHER: "OTHER",
} as const;

const TicketStatus = {
  NEW: "NEW",
  WAITING: "WAITING",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_HARDWARE: "WAITING_HARDWARE",
  RESOLVED: "RESOLVED",
  VALIDATED: "VALIDATED",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED",
} as const;

const PASSWORDS = {
  admin: "Admin123!",
  user: "User123!",
};

type UserSeed = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  serviceCode: string;
  phone: string;
  passwordHash: string;
};

async function upsertStockItem(data: {
  name: string;
  category: StockCategory;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  location: string;
  supplier?: string;
}) {
  const existing = await prisma.stockItem.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.stockItem.update({ where: { id: existing.id }, data });
  }
  return prisma.stockItem.create({ data });
}

async function upsertSchedule(data: {
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  status: string;
  technicianId?: string;
  ticketId?: string;
}) {
  const existing = await prisma.interventionSchedule.findFirst({
    where: { title: data.title, startAt: data.startAt },
  });
  if (existing) {
    return prisma.interventionSchedule.update({ where: { id: existing.id }, data });
  }
  return prisma.interventionSchedule.create({ data });
}

async function main() {
  const [passwordAdmin, passwordUser] = await Promise.all([
    bcrypt.hash(PASSWORDS.admin, 10),
    bcrypt.hash(PASSWORDS.user, 10),
  ]);

  const departments = await Promise.all(
    [
      { code: "ADM", name: "Administration generale" },
      { code: "SERV", name: "Services municipaux" },
      { code: "TECH", name: "Services techniques" },
    ].map((department) =>
      prisma.department.upsert({
        where: { code: department.code },
        update: department,
        create: department,
      }),
    ),
  );

  const byDepartment = Object.fromEntries(departments.map((department) => [department.code, department]));

  const services = await Promise.all(
    [
      { code: "IT", name: "Informatique", departmentId: byDepartment.ADM.id },
      { code: "FIN", name: "Finance", departmentId: byDepartment.ADM.id },
      { code: "URB", name: "Urbanisme", departmentId: byDepartment.SERV.id },
      { code: "EC", name: "Etat civil", departmentId: byDepartment.SERV.id },
      { code: "RH", name: "Ressources humaines", departmentId: byDepartment.ADM.id },
      { code: "JUR", name: "Affaires juridiques", departmentId: byDepartment.ADM.id },
      { code: "LOG", name: "Logistique", departmentId: byDepartment.TECH.id },
      { code: "PM", name: "Police municipale", departmentId: byDepartment.SERV.id },
    ].map((service) =>
      prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service,
      }),
    ),
  );

  const byService = Object.fromEntries(services.map((service) => [service.code, service]));

  const userSeeds: UserSeed[] = [
    {
      email: "admin@municipalite.tn",
      passwordHash: passwordAdmin,
      firstName: "Admin",
      lastName: "IT",
      role: Role.ADMIN,
      serviceCode: "IT",
      phone: "+216 72 000 100",
    },
    {
      email: "ahmed@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Ahmed",
      lastName: "Ben Ali",
      role: Role.USER,
      serviceCode: "FIN",
      phone: "+216 72 000 210",
    },
    {
      email: "fatma@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Fatma",
      lastName: "Zouari",
      role: Role.USER,
      serviceCode: "URB",
      phone: "+216 72 000 211",
    },
    {
      email: "wafaa@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Wafaa",
      lastName: "Kacem",
      role: Role.USER,
      serviceCode: "EC",
      phone: "+216 72 000 212",
    },
    {
      email: "yassine@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Yassine",
      lastName: "Hajri",
      role: Role.USER,
      serviceCode: "RH",
      phone: "+216 72 000 213",
    },
    {
      email: "moncef@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Moncef",
      lastName: "Daly",
      role: Role.USER,
      serviceCode: "PM",
      phone: "+216 72 000 214",
    },
    {
      email: "habiba@municipalite.tn",
      passwordHash: passwordUser,
      firstName: "Habiba",
      lastName: "Mrad",
      role: Role.USER,
      serviceCode: "LOG",
      phone: "+216 72 000 215",
    },
  ];

  const users = await Promise.all(
    userSeeds.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          serviceId: byService[user.serviceCode].id,
        },
        create: {
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          serviceId: byService[user.serviceCode].id,
        },
      }),
    ),
  );

  const byEmail = Object.fromEntries(users.map((user) => [user.email, user]));
  const admin = byEmail["admin@municipalite.tn"];

  const equipmentSeeds = [
    {
      inventoryNumber: "PC-ETAT-001",
      name: "Poste Etat civil 01",
      type: EquipmentType.PC,
      brand: "HP",
      model: "ProDesk 600 G5",
      ipAddress: "192.168.1.10",
      macAddress: "AA:BB:CC:DD:EE:01",
      system: "Windows 10 Pro",
      ram: "8 GB",
      storage: "256 GB SSD",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2023-07-15"),
      serviceId: byService.EC.id,
      userId: byEmail["wafaa@municipalite.tn"].id,
    },
    {
      inventoryNumber: "PC-FIN-015",
      name: "Poste Finance 15",
      type: EquipmentType.PC,
      brand: "Dell",
      model: "OptiPlex 3080",
      ipAddress: "192.168.1.25",
      macAddress: "AA:BB:CC:DD:EE:15",
      system: "Windows 11 Pro",
      ram: "16 GB",
      storage: "512 GB SSD",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2024-03-22"),
      serviceId: byService.FIN.id,
      userId: byEmail["ahmed@municipalite.tn"].id,
    },
    {
      inventoryNumber: "PRT-URB-002",
      name: "Imprimante Urbanisme",
      type: EquipmentType.PRINTER,
      brand: "HP",
      model: "LaserJet Pro M404",
      ipAddress: "192.168.1.40",
      macAddress: "AA:BB:CC:DD:EE:40",
      status: EquipmentStatus.MAINTENANCE,
      acquisitionDate: new Date("2022-11-05"),
      serviceId: byService.URB.id,
      userId: byEmail["fatma@municipalite.tn"].id,
    },
    {
      inventoryNumber: "SRV-ADM-01",
      name: "Serveur administration",
      type: EquipmentType.SERVER,
      brand: "Lenovo",
      model: "ThinkSystem ST550",
      ipAddress: "192.168.1.5",
      system: "Ubuntu Server 22.04",
      ram: "64 GB",
      storage: "4 TB RAID",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2022-01-18"),
      serviceId: byService.IT.id,
    },
    {
      inventoryNumber: "SW-ADM-01",
      name: "Switch administration",
      type: EquipmentType.SWITCH,
      brand: "Cisco",
      model: "CBS350-24T",
      ipAddress: "192.168.1.2",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2023-02-12"),
      serviceId: byService.IT.id,
    },
    {
      inventoryNumber: "CAM-EXT-03",
      name: "Camera IP exterieure",
      type: EquipmentType.IP_CAMERA,
      brand: "Hikvision",
      model: "DS-2CD",
      ipAddress: "192.168.1.60",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2021-09-02"),
      serviceId: byService.PM.id,
    },
    {
      inventoryNumber: "RTR-MAIN-01",
      name: "Routeur principal",
      type: EquipmentType.ROUTER,
      brand: "MikroTik",
      model: "RB4011",
      ipAddress: "192.168.1.1",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2023-10-10"),
      serviceId: byService.IT.id,
    },
    {
      inventoryNumber: "PC-RH-007",
      name: "Poste RH 07",
      type: EquipmentType.PC,
      brand: "Lenovo",
      model: "ThinkCentre M70q",
      ipAddress: "192.168.1.37",
      system: "Windows 11 Pro",
      ram: "8 GB",
      storage: "256 GB SSD",
      status: EquipmentStatus.IN_SERVICE,
      acquisitionDate: new Date("2024-01-08"),
      serviceId: byService.RH.id,
      userId: byEmail["yassine@municipalite.tn"].id,
    },
    {
      inventoryNumber: "LAP-LOG-004",
      name: "Portable logistique",
      type: EquipmentType.PC,
      brand: "Asus",
      model: "ExpertBook",
      ipAddress: "192.168.1.52",
      system: "Windows 11 Pro",
      ram: "16 GB",
      storage: "512 GB SSD",
      status: EquipmentStatus.STOCK,
      acquisitionDate: new Date("2024-06-01"),
      serviceId: byService.LOG.id,
      userId: byEmail["habiba@municipalite.tn"].id,
    },
  ];

  const equipment = await Promise.all(
    equipmentSeeds.map((item) =>
      prisma.equipment.upsert({
        where: { inventoryNumber: item.inventoryNumber },
        update: item,
        create: {
          ...item,
          histories: {
            create: {
              action: "CREATED",
              description: "Equipement ajoute par le seed de demonstration",
              createdById: admin.id,
            },
          },
        },
      }),
    ),
  );

  const byInventory = Object.fromEntries(equipment.map((item) => [item.inventoryNumber, item]));

  const ticketSeeds = [
    {
      reference: "INT-2026-00125",
      title: "Imprimante ne fonctionne plus",
      description: "L'imprimante du service Finance affiche une erreur et ne prend plus les impressions.",
      problemType: ProblemType.PRINTER,
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      serviceCode: "FIN",
      requesterEmail: "ahmed@municipalite.tn",
      technicianId: admin.id,
      equipmentId: byInventory["PC-FIN-015"].id,
      diagnostic: "File d'attente bloquee et pilote obsolete.",
      timeSpentMinutes: 45,
      createdAt: new Date("2026-06-08T08:15:00.000Z"),
    },
    {
      reference: "INT-2026-00126",
      title: "Probleme reseau au bureau Urbanisme",
      description: "Connexion lente et deconnexions intermittentes dans le bureau Urbanisme.",
      problemType: ProblemType.NETWORK,
      priority: Priority.URGENT,
      status: TicketStatus.WAITING,
      serviceCode: "URB",
      requesterEmail: "fatma@municipalite.tn",
      equipmentId: byInventory["SW-ADM-01"].id,
      createdAt: new Date("2026-06-08T09:20:00.000Z"),
    },
    {
      reference: "INT-2026-00127",
      title: "PC lent au service RH",
      description: "Le poste met plus de dix minutes a demarrer et bloque lors de l'ouverture des dossiers.",
      problemType: ProblemType.SOFTWARE,
      priority: Priority.MEDIUM,
      status: TicketStatus.NEW,
      serviceCode: "RH",
      requesterEmail: "yassine@municipalite.tn",
      equipmentId: byInventory["PC-RH-007"].id,
      createdAt: new Date("2026-06-08T11:00:00.000Z"),
    },
    {
      reference: "INT-2026-00128",
      title: "Remplacement SSD demande",
      description: "Le disque du poste Etat civil montre des erreurs SMART et doit etre remplace.",
      problemType: ProblemType.HARDWARE,
      priority: Priority.HIGH,
      status: TicketStatus.WAITING_HARDWARE,
      serviceCode: "EC",
      requesterEmail: "wafaa@municipalite.tn",
      technicianId: admin.id,
      equipmentId: byInventory["PC-ETAT-001"].id,
      diagnostic: "SSD en fin de vie, piece commandee.",
      createdAt: new Date("2026-06-07T13:10:00.000Z"),
    },
    {
      reference: "INT-2026-00129",
      title: "Mot de passe oublie",
      description: "Utilisateur bloque apres plusieurs tentatives de connexion.",
      problemType: ProblemType.SECURITY,
      priority: Priority.LOW,
      status: TicketStatus.RESOLVED,
      serviceCode: "LOG",
      requesterEmail: "habiba@municipalite.tn",
      technicianId: admin.id,
      solution: "Mot de passe reinitialise et double verification activee.",
      timeSpentMinutes: 20,
      resolvedAt: new Date("2026-06-07T15:30:00.000Z"),
      createdAt: new Date("2026-06-07T14:50:00.000Z"),
    },
    {
      reference: "INT-2026-00130",
      title: "Camera IP inaccessible",
      description: "La camera exterieure ne remonte plus dans la console de supervision.",
      problemType: ProblemType.NETWORK,
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      serviceCode: "PM",
      requesterEmail: "moncef@municipalite.tn",
      technicianId: admin.id,
      equipmentId: byInventory["CAM-EXT-03"].id,
      diagnostic: "Camera joignable par ping mais flux RTSP instable.",
      timeSpentMinutes: 75,
      createdAt: new Date("2026-06-06T10:30:00.000Z"),
    },
    {
      reference: "INT-2026-00131",
      title: "Installation logiciel comptabilite",
      description: "Installer la nouvelle version du logiciel de comptabilite sur le poste Finance.",
      problemType: ProblemType.SOFTWARE,
      priority: Priority.MEDIUM,
      status: TicketStatus.VALIDATED,
      serviceCode: "FIN",
      requesterEmail: "ahmed@municipalite.tn",
      technicianId: admin.id,
      equipmentId: byInventory["PC-FIN-015"].id,
      solution: "Version installee, licence activee et test utilisateur valide.",
      timeSpentMinutes: 60,
      resolvedAt: new Date("2026-06-05T12:00:00.000Z"),
      createdAt: new Date("2026-06-05T09:00:00.000Z"),
    },
    {
      reference: "INT-2026-00132",
      title: "Sauvegarde serveur mensuelle",
      description: "Controler l'etat des sauvegardes et lancer un test de restauration.",
      problemType: ProblemType.OTHER,
      priority: Priority.MEDIUM,
      status: TicketStatus.CLOSED,
      serviceCode: "IT",
      requesterEmail: "admin@municipalite.tn",
      technicianId: admin.id,
      equipmentId: byInventory["SRV-ADM-01"].id,
      solution: "Sauvegarde verifiee, test de restauration reussi.",
      timeSpentMinutes: 120,
      resolvedAt: new Date("2026-06-04T12:00:00.000Z"),
      closedAt: new Date("2026-06-04T14:00:00.000Z"),
      createdAt: new Date("2026-06-04T08:00:00.000Z"),
    },
    {
      reference: "INT-2026-00133",
      title: "Toner imprimante faible",
      description: "Le niveau de toner est critique sur l'imprimante Urbanisme.",
      problemType: ProblemType.PRINTER,
      priority: Priority.LOW,
      status: TicketStatus.NEW,
      serviceCode: "URB",
      requesterEmail: "fatma@municipalite.tn",
      equipmentId: byInventory["PRT-URB-002"].id,
      createdAt: new Date("2026-06-09T07:45:00.000Z"),
    },
    {
      reference: "INT-2026-00134",
      title: "Adresse IP en conflit",
      description: "Deux postes signalent la meme adresse IP dans le service Etat civil.",
      problemType: ProblemType.NETWORK,
      priority: Priority.URGENT,
      status: TicketStatus.NEW,
      serviceCode: "EC",
      requesterEmail: "wafaa@municipalite.tn",
      equipmentId: byInventory["PC-ETAT-001"].id,
      createdAt: new Date("2026-06-09T08:05:00.000Z"),
    },
    {
      reference: "INT-2026-00135",
      title: "Creation acces agent saisonnier",
      description: "Creer un compte temporaire pour un agent saisonnier affecte a la logistique.",
      problemType: ProblemType.SECURITY,
      priority: Priority.MEDIUM,
      status: TicketStatus.WAITING,
      serviceCode: "LOG",
      requesterEmail: "habiba@municipalite.tn",
      technicianId: admin.id,
      createdAt: new Date("2026-06-09T09:10:00.000Z"),
    },
    {
      reference: "INT-2026-00136",
      title: "Ecran noir au demarrage",
      description: "Le poste Police municipale ne demarre plus correctement apres une coupure electrique.",
      problemType: ProblemType.HARDWARE,
      priority: Priority.HIGH,
      status: TicketStatus.CANCELED,
      serviceCode: "PM",
      requesterEmail: "moncef@municipalite.tn",
      solution: "Demande annulee, le poste a redemarre apres controle de l'alimentation.",
      timeSpentMinutes: 10,
      createdAt: new Date("2026-06-03T08:40:00.000Z"),
    },
    {
      reference: "INT-2026-00137",
      title: "Configuration VPN responsable",
      description: "Configurer l'acces VPN pour consultation a distance des dossiers administratifs.",
      problemType: ProblemType.SECURITY,
      priority: Priority.HIGH,
      status: TicketStatus.RESOLVED,
      serviceCode: "JUR",
      requesterEmail: "admin@municipalite.tn",
      technicianId: admin.id,
      solution: "Profil VPN configure, MFA activee et test de connexion reussi.",
      timeSpentMinutes: 50,
      resolvedAt: new Date("2026-06-02T16:00:00.000Z"),
      createdAt: new Date("2026-06-02T14:00:00.000Z"),
    },
    {
      reference: "INT-2026-00138",
      title: "Mise a jour antivirus",
      description: "Plusieurs postes signalent une definition antivirus obsolete.",
      problemType: ProblemType.SECURITY,
      priority: Priority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      serviceCode: "IT",
      requesterEmail: "admin@municipalite.tn",
      technicianId: admin.id,
      diagnostic: "Agent antivirus non synchronise sur quatre postes.",
      timeSpentMinutes: 35,
      createdAt: new Date("2026-06-09T10:30:00.000Z"),
    },
    {
      reference: "INT-2026-00139",
      title: "Probleme scanner",
      description: "Le scanner du bureau RH ne detecte plus les documents.",
      problemType: ProblemType.HARDWARE,
      priority: Priority.LOW,
      status: TicketStatus.WAITING,
      serviceCode: "RH",
      requesterEmail: "yassine@municipalite.tn",
      technicianId: admin.id,
      createdAt: new Date("2026-06-09T11:15:00.000Z"),
    },
  ];

  const tickets = await Promise.all(
    ticketSeeds.map((ticket) =>
      prisma.ticket.upsert({
        where: { reference: ticket.reference },
        update: {
          title: ticket.title,
          description: ticket.description,
          problemType: ticket.problemType,
          priority: ticket.priority,
          status: ticket.status,
          serviceId: byService[ticket.serviceCode].id,
          requesterId: byEmail[ticket.requesterEmail].id,
          technicianId: ticket.technicianId,
          equipmentId: ticket.equipmentId,
          diagnostic: ticket.diagnostic,
          solution: ticket.solution,
          timeSpentMinutes: ticket.timeSpentMinutes,
          resolvedAt: ticket.resolvedAt,
          closedAt: ticket.closedAt,
          createdAt: ticket.createdAt,
        },
        create: {
          reference: ticket.reference,
          title: ticket.title,
          description: ticket.description,
          problemType: ticket.problemType,
          priority: ticket.priority,
          status: ticket.status,
          serviceId: byService[ticket.serviceCode].id,
          requesterId: byEmail[ticket.requesterEmail].id,
          technicianId: ticket.technicianId,
          equipmentId: ticket.equipmentId,
          diagnostic: ticket.diagnostic,
          solution: ticket.solution,
          timeSpentMinutes: ticket.timeSpentMinutes,
          resolvedAt: ticket.resolvedAt,
          closedAt: ticket.closedAt,
          createdAt: ticket.createdAt,
          histories: {
            create: [
              {
                action: "CREATED",
                toStatus: TicketStatus.NEW,
                message: "Ticket cree par le jeu de donnees de demonstration",
                createdById: byEmail[ticket.requesterEmail].id,
              },
              ...(ticket.technicianId
                ? [
                    {
                      action: "ASSIGNED",
                      message: "Ticket affecte a un technicien",
                      createdById: admin.id,
                    },
                  ]
                : []),
              ...(ticket.status !== TicketStatus.NEW
                ? [
                    {
                      action: "STATUS_CHANGED",
                      fromStatus: TicketStatus.NEW,
                      toStatus: ticket.status,
                      message: "Statut initialise par le seed",
                      createdById: ticket.technicianId ?? admin.id,
                    },
                  ]
                : []),
            ],
          },
        },
      }),
    ),
  );

  const byReference = Object.fromEntries(tickets.map((ticket) => [ticket.reference, ticket]));

  await Promise.all([
    prisma.knowledgeBase.upsert({
      where: { id: "00000000-0000-0000-0000-000000000001" },
      update: {
        title: "Probleme d'impression",
        content: "Verifier la file d'attente, redemarrer le spooler, controler le pilote et tester une page.",
        problemType: ProblemType.PRINTER,
        tags: ["imprimante", "spooler", "pilote"],
        createdById: admin.id,
      },
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        title: "Probleme d'impression",
        content: "Verifier la file d'attente, redemarrer le spooler, controler le pilote et tester une page.",
        problemType: ProblemType.PRINTER,
        tags: ["imprimante", "spooler", "pilote"],
        createdById: admin.id,
      },
    }),
    prisma.knowledgeBase.upsert({
      where: { id: "00000000-0000-0000-0000-000000000002" },
      update: {
        title: "PC lent",
        content: "Controler l'espace disque, les programmes au demarrage, les mises a jour et lancer un scan antivirus.",
        problemType: ProblemType.SOFTWARE,
        tags: ["performance", "windows", "antivirus"],
        createdById: admin.id,
      },
      create: {
        id: "00000000-0000-0000-0000-000000000002",
        title: "PC lent",
        content: "Controler l'espace disque, les programmes au demarrage, les mises a jour et lancer un scan antivirus.",
        problemType: ProblemType.SOFTWARE,
        tags: ["performance", "windows", "antivirus"],
        createdById: admin.id,
      },
    }),
    prisma.knowledgeBase.upsert({
      where: { id: "00000000-0000-0000-0000-000000000003" },
      update: {
        title: "Conflit adresse IP",
        content: "Identifier les adresses en double, reserver les IP critiques dans DHCP et redemarrer la carte reseau.",
        problemType: ProblemType.NETWORK,
        tags: ["reseau", "dhcp", "ip"],
        createdById: admin.id,
      },
      create: {
        id: "00000000-0000-0000-0000-000000000003",
        title: "Conflit adresse IP",
        content: "Identifier les adresses en double, reserver les IP critiques dans DHCP et redemarrer la carte reseau.",
        problemType: ProblemType.NETWORK,
        tags: ["reseau", "dhcp", "ip"],
        createdById: admin.id,
      },
    }),
  ]);

  await Promise.all([
    upsertStockItem({
      name: "Toner HP 85A",
      category: StockCategory.TONER,
      quantity: 2,
      minimumQuantity: 5,
      unit: "piece",
      location: "Armoire IT",
      supplier: "Fournisseur local",
    }),
    upsertStockItem({
      name: "Souris USB",
      category: StockCategory.MOUSE,
      quantity: 15,
      minimumQuantity: 10,
      unit: "piece",
      location: "Stock principal",
    }),
    upsertStockItem({
      name: "Clavier USB",
      category: StockCategory.KEYBOARD,
      quantity: 8,
      minimumQuantity: 10,
      unit: "piece",
      location: "Stock principal",
    }),
    upsertStockItem({
      name: "RAM 8GB DDR4",
      category: StockCategory.RAM,
      quantity: 6,
      minimumQuantity: 5,
      unit: "piece",
      location: "Stock principal",
    }),
    upsertStockItem({
      name: "Disque SSD 256GB",
      category: StockCategory.DISK,
      quantity: 4,
      minimumQuantity: 5,
      unit: "piece",
      location: "Armoire IT",
    }),
    upsertStockItem({
      name: "Cable reseau RJ45",
      category: StockCategory.CABLE,
      quantity: 20,
      minimumQuantity: 10,
      unit: "piece",
      location: "Stock principal",
    }),
  ]);

  await Promise.all([
    upsertSchedule({
      title: "Maintenance serveur",
      description: "Controle sauvegardes et mises a jour",
      startAt: new Date("2026-06-12T09:00:00.000Z"),
      endAt: new Date("2026-06-12T11:00:00.000Z"),
      status: TicketStatus.WAITING,
      technicianId: admin.id,
      ticketId: byReference["INT-2026-00132"].id,
    }),
    upsertSchedule({
      title: "Diagnostic reseau Urbanisme",
      description: "Controle switch, DHCP et prises reseau",
      startAt: new Date("2026-06-10T08:30:00.000Z"),
      endAt: new Date("2026-06-10T10:00:00.000Z"),
      status: TicketStatus.WAITING,
      technicianId: admin.id,
      ticketId: byReference["INT-2026-00126"].id,
    }),
    upsertSchedule({
      title: "Remplacement SSD Etat civil",
      description: "Remplacement disque et clonage systeme",
      startAt: new Date("2026-06-11T13:30:00.000Z"),
      endAt: new Date("2026-06-11T15:30:00.000Z"),
      status: TicketStatus.WAITING_HARDWARE,
      technicianId: admin.id,
      ticketId: byReference["INT-2026-00128"].id,
    }),
    upsertSchedule({
      title: "Controle camera IP",
      description: "Verification flux video et connectique",
      startAt: new Date("2026-06-13T10:00:00.000Z"),
      endAt: new Date("2026-06-13T11:30:00.000Z"),
      status: TicketStatus.IN_PROGRESS,
      technicianId: admin.id,
      ticketId: byReference["INT-2026-00130"].id,
    }),
  ]);

  await prisma.notification.deleteMany({
    where: {
      title: {
        in: ["Ticket urgent", "Ticket affecte", "Stock faible"],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        type: "TICKET_CREATED",
        title: "Ticket urgent",
        message: "INT-2026-00134 - Adresse IP en conflit",
        userId: admin.id,
        ticketId: byReference["INT-2026-00134"].id,
      },
      {
        type: "TICKET_ASSIGNED",
        title: "Ticket affecte",
        message: "INT-2026-00128 vous a ete affecte",
        userId: admin.id,
        ticketId: byReference["INT-2026-00128"].id,
      },
      {
        type: "STOCK_LOW",
        title: "Stock faible",
        message: "Toner HP 85A et Disque SSD 256GB sous le seuil minimum",
        userId: admin.id,
      },
    ],
  });

  await prisma.user.deleteMany({
    where: { email: { in: ["responsable.it@municipalite.tn", "sami@municipalite.tn", "leila@municipalite.tn", "mourad@municipalite.tn"] } },
  });

  console.log("Seed termine:");
  console.log(`- ${users.length} utilisateurs`);
  console.log(`- ${equipment.length} equipements`);
  console.log(`- ${tickets.length} tickets`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
