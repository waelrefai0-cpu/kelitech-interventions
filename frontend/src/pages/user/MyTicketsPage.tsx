import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
import Tooltip from "@mui/material/Tooltip";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import { api } from "../../api/client";
import { EmptyBlock, LoadingBlock } from "../../components/StateBlocks";
import { PriorityChip } from "../../components/PriorityChip";
import { StatusChip } from "../../components/StatusChip";
import { useAppOptions } from "../../hooks/useAppOptions";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Priority, ProblemType, Ticket, TicketStatus } from "../../types";
import { formatDate } from "../../utils/format";

interface TicketListResponse {
  items: Ticket[];
  total: number;
}

const typeStyle: Record<ProblemType, { icon: ReactElement; color: string; bg: string }> = {
  PRINTER: { icon: <PrintOutlinedIcon />, color: "#7c3aed", bg: "#f3e8ff" },
  SOFTWARE: { icon: <ComputerOutlinedIcon />, color: "#4f46e5", bg: "#e0e7ff" },
  NETWORK: { icon: <WifiOutlinedIcon />, color: "#16a34a", bg: "#dcfce7" },
  HARDWARE: { icon: <MemoryOutlinedIcon />, color: "#ea580c", bg: "#ffedd5" },
  SECURITY: { icon: <SecurityOutlinedIcon />, color: "#dc2626", bg: "#fee2e2" },
  OTHER: { icon: <HelpOutlineOutlinedIcon />, color: "#475569", bg: "#e2e8f0" },
};

function getTypeStyle(type: ProblemType) {
  return typeStyle[type] ?? typeStyle.OTHER;
}

export function MyTicketsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [service, setService] = useState("");
  const [problemType, setProblemType] = useState<ProblemType | "">("");
  const { priorityOptions, problemTypeLabels, problemTypeOptions, statusOptions } = useAppOptions();

  const { data, loading } = useAsyncData(async () => {
    const response = await api.get<TicketListResponse>("/tickets?pageSize=100");
    return response.data;
  }, []);

  const tickets = data?.items ?? [];
  const services = useMemo(() => Array.from(new Set(tickets.map((ticket) => ticket.service.name))).sort(), [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const haystack = `${ticket.reference} ${ticket.title} ${ticket.description} ${ticket.service.name}`.toLowerCase();
      return (
        (!q || haystack.includes(q.toLowerCase())) &&
        (!status || ticket.status === status) &&
        (!priority || ticket.priority === priority) &&
        (!service || ticket.service.name === service) &&
        (!problemType || ticket.problemType === problemType)
      );
    });
  }, [priority, problemType, q, service, status, tickets]);

  const metrics = useMemo(() => {
    const waiting = tickets.filter((ticket) => ["NEW", "WAITING", "WAITING_HARDWARE"].includes(ticket.status)).length;
    const inProgress = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const resolved = tickets.filter((ticket) => ["RESOLVED", "VALIDATED", "CLOSED"].includes(ticket.status)).length;
    const urgent = tickets.filter((ticket) => ticket.priority === "URGENT" && !["CLOSED", "CANCELED"].includes(ticket.status)).length;

    return [
      { label: "Mes demandes", value: tickets.length, hint: "Toutes les demandes", icon: <AssignmentOutlinedIcon />, color: "#2563eb", bg: "#dbeafe" },
      { label: "En cours", value: inProgress, hint: "Actuellement en traitement", icon: <HourglassTopOutlinedIcon />, color: "#d97706", bg: "#fef3c7" },
      { label: "En attente", value: waiting, hint: "En attente de traitement", icon: <RefreshOutlinedIcon />, color: "#0284c7", bg: "#e0f2fe" },
      { label: "Resolus", value: resolved, hint: "Demandes terminees", icon: <CheckCircleOutlineOutlinedIcon />, color: "#16a34a", bg: "#dcfce7" },
      { label: "Urgents", value: urgent, hint: "Necessite une attention", icon: <WarningAmberOutlinedIcon />, color: "#dc2626", bg: "#fee2e2" },
    ];
  }, [tickets]);

  function resetFilters() {
    setQ("");
    setStatus("");
    setPriority("");
    setService("");
    setProblemType("");
  }

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 shadow-sm sm:h-14 sm:w-14">
            <ViewTicketIcon />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">Mes interventions</h1>
            <p className="mt-1 truncate text-sm text-slate-500 sm:text-base">Historique et suivi de vos demandes d'intervention.</p>
          </div>
        </div>
        <Button component={Link} to="/user/new-ticket" variant="contained" size="large" startIcon={<AddOutlinedIcon />} sx={{ minHeight: 48, px: 3, width: { xs: "100%", sm: "auto" } }}>
          Nouvelle demande
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Paper key={metric.label} elevation={0} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg sm:h-14 sm:w-14" style={{ color: metric.color, backgroundColor: metric.bg }}>
                {metric.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{metric.value}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium" style={{ color: metric.color }}>
              {metric.hint}
            </p>
          </Paper>
        ))}
      </div>

      {loading ? <LoadingBlock /> : null}
      {!loading && tickets.length === 0 ? <EmptyBlock label="Aucune demande" /> : null}

      {!loading && tickets.length ? (
        <Paper elevation={0} className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(240px,1fr),150px,150px,auto] xl:grid-cols-[minmax(260px,1fr),145px,145px,145px,145px,auto]">
            <TextField
              size="small"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Rechercher une demande..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField size="small" select label="Statut" value={status} onChange={(event) => setStatus(event.target.value as TicketStatus | "")}>
              <MenuItem value="">Tous</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Priorite" value={priority} onChange={(event) => setPriority(event.target.value as Priority | "")}>
              <MenuItem value="">Toutes</MenuItem>
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Service" value={service} onChange={(event) => setService(event.target.value)} className="hidden xl:block">
              <MenuItem value="">Tous</MenuItem>
              {services.map((serviceName) => (
                <MenuItem key={serviceName} value={serviceName}>
                  {serviceName}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Type" value={problemType} onChange={(event) => setProblemType(event.target.value as ProblemType | "")} className="hidden xl:block">
              <MenuItem value="">Tous</MenuItem>
              {problemTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={resetFilters} sx={{ minHeight: 40, overflow: "hidden" }}>
              Reinitialiser
            </Button>
            <Button variant="outlined" startIcon={<FilterAltOutlinedIcon />} sx={{ display: { xs: "inline-flex", xl: "none" }, minHeight: 40 }}>
              Filtres
            </Button>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-5">
              <EmptyBlock label="Aucune demande ne correspond aux filtres" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {filteredTickets.slice(0, 5).map((ticket) => (
                  <Paper key={ticket.id} component={Link} to={`/user/tickets/${ticket.id}`} elevation={0} className="block rounded-lg border border-slate-200 p-4 active:bg-blue-50">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-lg [&>svg]:text-[26px]"
                        style={{ color: getTypeStyle(ticket.problemType).color, backgroundColor: getTypeStyle(ticket.problemType).bg }}
                      >
                        {getTypeStyle(ticket.problemType).icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-slate-950">{ticket.reference}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">{ticket.title}</p>
                          </div>
                          <ChevronRightOutlinedIcon className="shrink-0 text-slate-400" />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <AccountBalanceOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                            <span className="truncate">{ticket.service.name}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="grid h-5 w-5 place-items-center [&>svg]:text-[18px]" style={{ color: getTypeStyle(ticket.problemType).color }}>
                              {getTypeStyle(ticket.problemType).icon}
                            </span>
                            <span className="truncate">{problemTypeLabels[ticket.problemType] ?? ticket.problemType}</span>
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <PriorityChip priority={ticket.priority} />
                          <StatusChip status={ticket.status} />
                          <span className="text-xs font-semibold text-slate-500">{formatDate(ticket.createdAt, "DD/MM/YYYY HH:mm")}</span>
                        </div>
                      </div>
                    </div>
                  </Paper>
                ))}
              </div>
              <TableContainer sx={{ display: { xs: "none", md: "block" }, maxWidth: "100%", overflowX: "auto" }}>
                <Table sx={{ minWidth: 760, width: "100%", tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 800, color: "#0f172a", bgcolor: "#fbfdff", borderColor: "#e2e8f0" } }}>
                      <TableCell sx={{ width: 170, px: 2 }}>Reference</TableCell>
                      <TableCell sx={{ px: 2 }}>Titre</TableCell>
                      <TableCell sx={{ width: 112, px: 1.5 }}>Service</TableCell>
                      <TableCell sx={{ width: 116, px: 1.5 }}>Type</TableCell>
                      <TableCell sx={{ width: 92, px: 1.5 }}>Priorite</TableCell>
                      <TableCell sx={{ width: 104, px: 1.5 }}>Statut</TableCell>
                      <TableCell sx={{ width: 92, px: 1.5 }}>Date</TableCell>
                      <TableCell sx={{ width: 74, px: 1 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTickets.slice(0, 5).map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        hover
                        sx={{
                          "& td": { borderColor: "#e2e8f0", py: 2 },
                          "&:hover": { bgcolor: "#f8fbff" },
                        }}
                      >
                        <TableCell sx={{ px: 2 }}>
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg [&>svg]:text-[24px]"
                              style={{ color: getTypeStyle(ticket.problemType).color, backgroundColor: getTypeStyle(ticket.problemType).bg }}
                            >
                              {getTypeStyle(ticket.problemType).icon}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-950">{ticket.reference}</p>
                              <p className="text-sm font-semibold text-slate-500">#{ticket.reference.split("-").at(-1)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell sx={{ px: 2 }}>
                          <p className="truncate font-bold text-slate-950">{ticket.title}</p>
                          <p className="mt-1 max-w-sm truncate text-sm text-slate-500">{ticket.description}</p>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-slate-600">
                            <AccountBalanceOutlinedIcon sx={{ fontSize: 20, color: "#64748b" }} />
                            <span className="truncate">{ticket.service.name}</span>
                          </span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <span className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-slate-600">
                            <span style={{ color: getTypeStyle(ticket.problemType).color }}>{getTypeStyle(ticket.problemType).icon}</span>
                            <span className="truncate">{problemTypeLabels[ticket.problemType] ?? ticket.problemType}</span>
                          </span>
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <PriorityChip priority={ticket.priority} />
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <StatusChip status={ticket.status} />
                        </TableCell>
                        <TableCell sx={{ px: 1.5 }}>
                          <p className="font-semibold text-slate-700">{formatDate(ticket.createdAt, "DD/MM/YYYY")}</p>
                          <p className="text-sm text-slate-500">{formatDate(ticket.createdAt, "HH:mm")}</p>
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1 }}>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip title="Voir la demande">
                              <IconButton component={Link} to={`/user/tickets/${ticket.id}`} size="small" sx={{ border: "1px solid #dbe3ef", borderRadius: "8px" }}>
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <IconButton component={Link} to={`/user/tickets/${ticket.id}`} size="small" className="hidden xl:inline-flex">
                              <ChevronRightOutlinedIcon />
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <p>
                  Affichage 1 a {Math.min(filteredTickets.length, 5)} sur {filteredTickets.length} demandes
                </p>
                <div className="flex items-center justify-center gap-2">
                  <IconButton size="small">
                    <ChevronRightOutlinedIcon sx={{ transform: "rotate(180deg)" }} />
                  </IconButton>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 font-bold text-white">1</span>
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white font-semibold text-slate-600">2</span>
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white font-semibold text-slate-600">3</span>
                  <IconButton size="small">
                    <ChevronRightOutlinedIcon />
                  </IconButton>
                </div>
              </div>
            </>
          )}
        </Paper>
      ) : null}
    </div>
  );
}

function ViewTicketIcon() {
  return <AssignmentOutlinedIcon sx={{ fontSize: 32 }} />;
}
