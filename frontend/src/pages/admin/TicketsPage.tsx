import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/PriorityChip";
import { StatusChip } from "../../components/StatusChip";
import { EmptyBlock, LoadingBlock } from "../../components/StateBlocks";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useAppOptions } from "../../hooks/useAppOptions";
import type { Priority, ProblemType, Service, Ticket, TicketStatus } from "../../types";
import { formatDate, fullName } from "../../utils/format";

interface TicketListResponse {
  items: Ticket[];
  total: number;
}

export function TicketsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [problemType, setProblemType] = useState<ProblemType | "">("");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const { priorityOptions, problemTypeLabels, problemTypeOptions, statusOptions } = useAppOptions();

  useEffect(() => {
    api.get<Service[]>("/services").then(({ data }) => setServices(data));
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (problemType) params.set("problemType", problemType);
    if (serviceId) params.set("serviceId", serviceId);
    return params.toString();
  }, [problemType, priority, q, serviceId, status]);

  const { data, loading } = useAsyncData(async () => {
    const response = await api.get<TicketListResponse>(`/tickets?${query}`);
    return response.data;
  }, [query]);

  return (
    <>
      <PageHeader
        title="Demandes"
        subtitle={`${data?.total ?? 0} demande(s)`}
        actions={
          <Button component={Link} to="/admin/new-ticket" variant="contained" startIcon={<AddOutlinedIcon />}>
            Nouveau
          </Button>
        }
      />
      <Paper elevation={0} className="mb-5 rounded-lg border border-slate-200 p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-5">
          <TextField
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher"
            InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: "#94a3b8" }} /> }}
          />
          <TextField select label="Statut" value={status} onChange={(event) => setStatus(event.target.value as TicketStatus | "")}>
            <MenuItem value="">Tous</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Priorite" value={priority} onChange={(event) => setPriority(event.target.value as Priority | "")}>
            <MenuItem value="">Toutes</MenuItem>
            {priorityOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Service" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <MenuItem value="">Tous</MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Type" value={problemType} onChange={(event) => setProblemType(event.target.value as ProblemType | "")}>
            <MenuItem value="">Tous</MenuItem>
            {problemTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>
      </Paper>
      {loading ? <LoadingBlock /> : null}
      {!loading && data?.items.length === 0 ? <EmptyBlock label="Aucune demande" /> : null}
      {!loading && data?.items.length ? (
        <TableContainer component={Paper} elevation={0} className="rounded-lg border border-slate-200 shadow-soft">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Demandeur</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priorite</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Technicien</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((ticket) => (
                <TableRow key={ticket.id} hover component={Link} to={`/admin/tickets/${ticket.id}`} sx={{ cursor: "pointer" }}>
                  <TableCell className="font-semibold text-blue-700">{ticket.reference}</TableCell>
                  <TableCell>{fullName(ticket.requester)}</TableCell>
                  <TableCell>{ticket.service.name}</TableCell>
                  <TableCell>{problemTypeLabels[ticket.problemType]}</TableCell>
                  <TableCell>
                    <PriorityChip priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={ticket.status} />
                  </TableCell>
                  <TableCell>{fullName(ticket.technician)}</TableCell>
                  <TableCell>{formatDate(ticket.createdAt, "DD/MM/YYYY")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </>
  );
}
