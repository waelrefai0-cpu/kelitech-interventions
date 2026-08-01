import { Link, useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { API_URL, api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/PriorityChip";
import { StatusChip } from "../../components/StatusChip";
import { EmptyBlock, LoadingBlock } from "../../components/StateBlocks";
import { problemTypeLabels } from "../../data/labels";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Ticket } from "../../types";
import { formatDate, fullName, minutesToHuman } from "../../utils/format";

const baseUrl = API_URL.replace(/\/api$/, "");

export function UserTicketDetailPage() {
  const { id } = useParams();
  const { data: ticket, loading } = useAsyncData(async () => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  }, [id]);

  if (loading) return <LoadingBlock />;
  if (!ticket) return <EmptyBlock label="Demande introuvable" />;

  return (
    <>
      <PageHeader
        title={ticket.reference}
        subtitle={ticket.title}
        actions={
          <Button component={Link} to="/user" variant="outlined" startIcon={<ArrowBackOutlinedIcon />}>
            Retour
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr,340px]">
        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
          </div>
          <h2 className="text-lg font-bold text-slate-950">Description du probleme</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Info label="Type" value={problemTypeLabels[ticket.problemType]} />
            <Info label="Service" value={ticket.service.name} />
            <Info label="Technicien" value={fullName(ticket.technician)} />
            <Info label="Temps passe" value={minutesToHuman(ticket.timeSpentMinutes)} />
          </div>

          {ticket.diagnostic || ticket.solution ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {ticket.diagnostic ? <TextBlock label="Diagnostic" value={ticket.diagnostic} /> : null}
              {ticket.solution ? <TextBlock label="Solution appliquee" value={ticket.solution} /> : null}
            </div>
          ) : null}

          {ticket.attachments?.length ? (
            <div className="mt-6">
              <h3 className="text-base font-bold text-slate-950">Pieces jointes</h3>
              <div className="mt-3 grid gap-2">
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
        </Paper>

        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Historique</h2>
          <div className="mt-4 space-y-4">
            {ticket.histories?.map((history) => (
              <div key={history.id} className="border-l-2 border-blue-200 pl-3">
                <p className="text-sm font-bold text-slate-900">{history.message ?? history.action}</p>
                <p className="text-xs text-slate-500">{formatDate(history.createdAt)}</p>
                <p className="text-xs text-slate-500">{fullName(history.createdBy)}</p>
              </div>
            ))}
          </div>
        </Paper>
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-950">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
