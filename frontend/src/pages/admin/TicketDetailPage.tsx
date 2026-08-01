import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { API_URL, api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/PriorityChip";
import { StatusChip } from "../../components/StatusChip";
import { EmptyBlock, LoadingBlock } from "../../components/StateBlocks";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useAppOptions } from "../../hooks/useAppOptions";
import type { Ticket, TicketStatus, User } from "../../types";
import { formatDate, fullName, minutesToHuman } from "../../utils/format";

const baseUrl = API_URL.replace(/\/api$/, "");

export function TicketDetailPage() {
  const { id } = useParams();
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [error, setError] = useState("");
  const { priorityLabels, problemTypeLabels, statusOptions } = useAppOptions();
  const { data: ticket, loading, refresh } = useAsyncData(async () => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  }, [id]);

  useEffect(() => {
    api.get<User[]>("/users/technicians").then(({ data }) => setTechnicians(data));
  }, []);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      await api.patch(`/tickets/${id}/status`, {
        status: formData.get("status"),
        diagnostic: formData.get("diagnostic"),
        solution: formData.get("solution"),
        timeSpentMinutes: formData.get("timeSpentMinutes"),
        message: "Mise a jour depuis la fiche demande",
      });
      await refresh();
    } catch {
      setError("Impossible de mettre a jour la demande.");
    }
  }

  async function assignTechnician(technicianId: string) {
    setError("");
    try {
      await api.patch(`/tickets/${id}/assign`, { technicianId: technicianId || null });
      await refresh();
    } catch {
      setError("Affectation impossible.");
    }
  }

  if (loading) return <LoadingBlock />;
  if (!ticket) return <EmptyBlock label="Demande introuvable" />;

  return (
    <>
      <PageHeader
        title={ticket.reference}
        subtitle={ticket.title}
        actions={
          <Button component={Link} to="/admin/tickets" variant="outlined" startIcon={<ArrowBackOutlinedIcon />}>
            Retour
          </Button>
        }
      />
      {error ? (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr,360px]">
        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
          </div>
          <h2 className="text-lg font-bold text-slate-950">Description du probleme</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Info label="Demandeur" value={fullName(ticket.requester)} />
            <Info label="Service" value={ticket.service.name} />
            <Info label="Type" value={problemTypeLabels[ticket.problemType]} />
            <Info label="Priorite" value={priorityLabels[ticket.priority]} />
            <Info label="Technicien" value={fullName(ticket.technician)} />
            <Info label="Temps passe" value={minutesToHuman(ticket.timeSpentMinutes)} />
          </div>

          {ticket.attachments?.length ? (
            <div className="mt-6">
              <h3 className="text-base font-bold text-slate-950">Pieces jointes</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={`${baseUrl}${attachment.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700"
                  >
                    {attachment.originalName}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <h3 className="text-base font-bold text-slate-950">Historique</h3>
            <div className="mt-4 space-y-4">
              {ticket.histories?.map((history) => (
                <div key={history.id} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-sm font-bold text-slate-900">{history.message ?? history.action}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(history.createdAt)} - {fullName(history.createdBy)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Paper>

        <div className="space-y-5">
          <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-slate-950">Affectation</h2>
            <TextField
              select
              label="Technicien"
              value={ticket.technicianId ?? ""}
              onChange={(event) => assignTechnician(event.target.value)}
              fullWidth
            >
              <MenuItem value="">Non affecte</MenuItem>
              {technicians.map((technician) => (
                <MenuItem key={technician.id} value={technician.id}>
                  {fullName(technician)}
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-slate-950">Traitement</h2>
            <form className="space-y-4" onSubmit={updateStatus}>
              <TextField select name="status" label="Statut" defaultValue={ticket.status} fullWidth>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField name="diagnostic" label="Diagnostic" defaultValue={ticket.diagnostic ?? ""} multiline minRows={3} fullWidth />
              <TextField name="solution" label="Solution appliquee" defaultValue={ticket.solution ?? ""} multiline minRows={3} fullWidth />
              <TextField name="timeSpentMinutes" label="Temps passe (minutes)" type="number" defaultValue={ticket.timeSpentMinutes ?? 0} fullWidth />
              <Button type="submit" variant="contained" fullWidth startIcon={<SaveOutlinedIcon />}>
                Enregistrer
              </Button>
            </form>
          </Paper>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
