import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardArrowLeftOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import MonitorOutlinedIcon from "@mui/icons-material/MonitorOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import dayjs from "dayjs";
import { api } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useAppOptions } from "../../hooks/useAppOptions";
import type { Priority, ProblemType, Ticket } from "../../types";
import { formatDate } from "../../utils/format";

type QueueTab = "ALL" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";

const tabs: { value: QueueTab; label: string; priority?: Priority }[] = [
  { value: "ALL", label: "Tous" },
  { value: "URGENT", label: "Urgents", priority: "URGENT" },
  { value: "HIGH", label: "Haute priorite", priority: "HIGH" },
  { value: "MEDIUM", label: "Moyenne priorite", priority: "MEDIUM" },
  { value: "LOW", label: "Basse priorite", priority: "LOW" },
];

const priorityTone: Record<Priority, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-emerald-100 text-emerald-700",
};

const rankTone: Record<Priority, string> = {
  URGENT: "bg-red-50 text-red-700",
  HIGH: "bg-rose-50 text-rose-700",
  MEDIUM: "bg-orange-50 text-orange-700",
  LOW: "bg-emerald-50 text-emerald-700",
};

function waitMinutes(ticket: Ticket, now: dayjs.Dayjs) {
  return Math.max(now.diff(dayjs(ticket.createdAt), "minute"), 0);
}

function waitLabel(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days) return `${days}j ${hours}h`;
  if (hours) return `${hours}h ${rest}m`;
  return `${rest}m`;
}

function TypeIcon({ type }: { type: ProblemType }) {
  const icon =
    type === "PRINTER" ? (
      <PrintOutlinedIcon />
    ) : type === "NETWORK" ? (
      <WifiOutlinedIcon />
    ) : type === "HARDWARE" ? (
      <MonitorOutlinedIcon />
    ) : (
      <MonitorOutlinedIcon />
    );

  return <span className="grid h-7 w-7 place-items-center text-blue-600 [&>svg]:text-[21px]">{icon}</span>;
}

export function WaitingListPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [type, setType] = useState("");
  const [activeTab, setActiveTab] = useState<QueueTab>("ALL");
  const now = useMemo(() => dayjs(), []);
  const { priorityLabels, problemTypeLabels } = useAppOptions();

  const { data, loading, refresh } = useAsyncData(async () => {
    const response = await api.get<Ticket[]>("/tickets/waiting-list");
    return response.data;
  }, []);

  const tickets = data ?? [];
  const serviceOptions = useMemo(() => Array.from(new Set(tickets.map((ticket) => ticket.service.name))).sort(), [tickets]);
  const typeOptions = useMemo(() => Array.from(new Set(tickets.map((ticket) => ticket.problemType))), [tickets]);

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedPriority = tabs.find((tab) => tab.value === activeTab)?.priority;

    return tickets.filter((ticket) => {
      const matchesQuery =
        !normalizedQuery ||
        [ticket.reference, ticket.title, ticket.service.name, problemTypeLabels[ticket.problemType]].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesService = !service || ticket.service.name === service;
      const matchesType = !type || ticket.problemType === type;
      const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;
      return matchesQuery && matchesService && matchesType && matchesPriority;
    });
  }, [activeTab, query, service, tickets, type]);

  const userTicketIndex = user ? tickets.findIndex((ticket) => ticket.requesterId === user.id) : -1;
  const userTicket = userTicketIndex >= 0 ? tickets[userTicketIndex] : undefined;
  const averageWait = tickets.length ? Math.round(tickets.reduce((sum, ticket) => sum + waitMinutes(ticket, now), 0) / tickets.length) : 0;
  const urgentCount = tickets.filter((ticket) => ticket.priority === "URGENT").length;
  const myPendingCount = user ? tickets.filter((ticket) => ticket.requesterId === user.id).length : 0;

  return (
    <>
      <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-2xl">File d'attente des interventions</h1>
          <p className="mt-2 text-base text-slate-500 sm:text-sm">Voici la liste des demandes en attente de traitement.</p>
        </div>
        <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={refresh} sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 44 }}>
          Actualiser
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),306px]">
        <div className="min-w-0 space-y-5 xl:order-1">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),188px,194px,112px]">
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un ticket, un service..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField size="small" select value={service} onChange={(event) => setService(event.target.value)} aria-label="Service">
              <MenuItem value="">Tous les services</MenuItem>
              {serviceOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select value={type} onChange={(event) => setType(event.target.value)} aria-label="Type">
              <MenuItem value="">Tous les types</MenuItem>
              {typeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {problemTypeLabels[option]}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" startIcon={<FilterAltOutlinedIcon />} onClick={() => setActiveTab("ALL")} sx={{ minHeight: 40 }}>
              Filtres
            </Button>
          </div>

          <Paper elevation={0} className="overflow-hidden rounded-lg border border-slate-200 shadow-soft">
            <div className="scrollbar-thin flex overflow-x-auto border-b border-slate-200 px-3">
              {tabs.map((tab) => {
                const count = tab.priority ? tickets.filter((ticket) => ticket.priority === tab.priority).length : tickets.length;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={[
                      "flex min-h-14 shrink-0 items-center justify-center gap-2 border-b-2 px-4 text-sm font-bold transition sm:min-h-16 sm:flex-1 sm:px-1",
                      isActive ? "border-blue-600 text-slate-950" : "border-transparent text-slate-600 hover:text-blue-700",
                    ].join(" ")}
                  >
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {filteredTickets.map((ticket) => {
                const position = tickets.findIndex((item) => item.id === ticket.id) + 1;
                const canOpen = isAdminView || ticket.requesterId === user?.id;
                const isCurrentUserTicket = ticket.requesterId === user?.id;
                const ticketPath = isAdminView ? `/admin/tickets/${ticket.id}` : `/user/tickets/${ticket.id}`;
                const content = (
                  <div className={["rounded-lg border p-4", isCurrentUserTicket ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"].join(" ")}>
                    <div className="flex items-start gap-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg text-base font-bold ${rankTone[ticket.priority] ?? "bg-slate-50 text-slate-700"}`}>{position}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-slate-950">{ticket.reference}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">{ticket.title}</p>
                          </div>
                          {canOpen ? <KeyboardArrowRightOutlinedIcon className="shrink-0 text-slate-400" /> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Cree le {formatDate(ticket.createdAt)}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <ApartmentOutlinedIcon sx={{ fontSize: 18 }} />
                            <span className="truncate">{ticket.service.name}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <TypeIcon type={ticket.problemType} />
                            <span className="truncate">{problemTypeLabels[ticket.problemType]}</span>
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityTone[ticket.priority] ?? "bg-slate-100 text-slate-700"}`}>{priorityLabels[ticket.priority] ?? ticket.priority}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                            <AccessTimeOutlinedIcon fontSize="small" />
                            {waitLabel(waitMinutes(ticket, now))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return canOpen ? (
                  <Link key={ticket.id} to={ticketPath} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={ticket.id}>{content}</div>
                );
              })}
            </div>

            <TableContainer sx={{ display: { xs: "none", md: "block" }, maxWidth: "100%", overflowX: "auto" }}>
              <Table sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 66, px: 2 }}>Position</TableCell>
                    <TableCell sx={{ width: 106, px: 1.5 }}>Reference</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell sx={{ width: 106, px: 1.5 }}>Service</TableCell>
                    <TableCell sx={{ width: 96, px: 1.5 }}>Type</TableCell>
                    <TableCell sx={{ width: 94, px: 1.5 }}>Priorite</TableCell>
                    <TableCell sx={{ width: 78, px: 1.5 }}>Attente</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const position = tickets.findIndex((item) => item.id === ticket.id) + 1;
                    const canOpen = isAdminView || ticket.requesterId === user?.id;
                    const isCurrentUserTicket = ticket.requesterId === user?.id;
                    const ticketPath = isAdminView ? `/admin/tickets/${ticket.id}` : `/user/tickets/${ticket.id}`;
                    return (
                      <TableRow
                        key={ticket.id}
                        hover
                        className={isCurrentUserTicket ? "border-l-4 border-l-blue-600 bg-blue-50/70" : undefined}
                        sx={{
                          "&:hover": {
                            backgroundColor: isCurrentUserTicket ? "rgba(219, 234, 254, 0.9)" : undefined,
                          },
                        }}
                      >
                        <TableCell sx={{ px: 2 }}>
                          <span className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ${rankTone[ticket.priority] ?? "bg-slate-50 text-slate-700"}`}>{position}</span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }} className="font-semibold text-slate-800">
                          {canOpen ? (
                            <Link className="text-blue-700 hover:underline" to={ticketPath}>
                              {ticket.reference}
                            </Link>
                          ) : (
                            ticket.reference
                          )}
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <p className="line-clamp-1 font-bold text-slate-950">{ticket.title}</p>
                          <p className="mt-1 text-xs text-slate-500">Cree le {formatDate(ticket.createdAt)}</p>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className="inline-flex max-w-full items-center gap-2 text-sm text-slate-600">
                            <ApartmentOutlinedIcon fontSize="small" />
                            <span className="truncate">{ticket.service.name}</span>
                          </span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className="inline-flex max-w-full items-center gap-2 text-sm text-slate-600">
                            <TypeIcon type={ticket.problemType} />
                            <span className="truncate">{problemTypeLabels[ticket.problemType]}</span>
                          </span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityTone[ticket.priority] ?? "bg-slate-100 text-slate-700"}`}>{priorityLabels[ticket.priority] ?? ticket.priority}</span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600">
                            <AccessTimeOutlinedIcon fontSize="small" />
                            {waitLabel(waitMinutes(ticket, now))}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
              <span>
                Affichage de {filteredTickets.length ? 1 : 0} a {filteredTickets.length} sur {tickets.length} demandes en attente
              </span>
              <div className="flex items-center gap-2">
                <Button size="small" variant="text" disabled startIcon={<KeyboardArrowLeftOutlinedIcon />}>
                  1
                </Button>
                <Button size="small" variant="text" disabled endIcon={<KeyboardArrowRightOutlinedIcon />}>
                  2
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        <aside className="order-first grid gap-5 min-[900px]:grid-cols-2 xl:order-2 xl:block xl:space-y-5">
          {!isAdminView ? (
            <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
              <h2 className="text-base font-bold text-slate-950">Votre position dans la file d'attente</h2>
              <div className="mt-5 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-700">Votre position actuelle</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-5xl font-black text-blue-700">
                    {userTicket ? userTicketIndex + 1 : "-"}
                    {userTicket ? <sup className="ml-1 text-lg">eme</sup> : null}
                  </p>
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-700">
                    <PersonSearchOutlinedIcon fontSize="large" />
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {userTicket ? `Il y a ${userTicketIndex} demande(s) devant vous.` : "Vous n'avez aucune demande en attente dans la file."}
              </p>
              <p className="mt-3 text-xs text-slate-500">Derniere mise a jour : {formatDate(new Date().toISOString())}</p>
            </Paper>
          ) : null}

          <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
            <h2 className="text-base font-bold text-slate-950">Statistiques de la file d'attente</h2>
            <div className="mt-5 divide-y divide-slate-200">
              <Stat icon={<AccessTimeOutlinedIcon />} label="Temps d'attente moyen" value={waitLabel(averageWait)} tone="bg-orange-50 text-orange-600" />
              <Stat icon={<CalendarMonthOutlinedIcon />} label="Demandes en attente" value={String(tickets.length)} tone="bg-emerald-50 text-emerald-600" />
              <Stat icon={<PriorityHighOutlinedIcon />} label="Demandes urgentes" value={String(urgentCount)} tone="bg-red-50 text-red-600" />
              {!isAdminView ? <Stat icon={<TrendingUpOutlinedIcon />} label="Vos demandes" value={String(myPendingCount)} tone="bg-blue-50 text-blue-600" /> : null}
            </div>
          </Paper>

          <Paper elevation={0} className="rounded-lg border border-blue-100 bg-blue-50 p-4 min-[900px]:col-span-2 xl:col-span-1">
            <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
              <InfoOutlinedIcon fontSize="small" />
              Comment ca fonctionne ?
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Les demandes sont traitees selon l'ordre de priorite puis par ordre d'arrivee. Les demandes urgentes sont traitees en priorite.</p>
          </Paper>
        </aside>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement de la file d'attente...</p> : null}
    </>
  );
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
