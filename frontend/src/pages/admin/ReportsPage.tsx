import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { LoadingBlock } from "../../components/StateBlocks";
import { priorityLabels, problemTypeLabels } from "../../data/labels";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Priority, ProblemType } from "../../types";

interface ReportStats {
  byService: { service: string; count: number }[];
  byType: { problemType: ProblemType; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  byTechnician: { technician: string; count: number }[];
  averageResolutionMinutes: number;
}

export function ReportsPage() {
  const { data, loading } = useAsyncData(async () => {
    const response = await api.get<ReportStats>("/reports/stats");
    return response.data;
  }, []);

  if (loading) return <LoadingBlock />;
  if (!data) return null;

  const typeData = data.byType.map((entry) => ({ name: problemTypeLabels[entry.problemType], count: entry.count }));
  const priorityData = data.byPriority.map((entry) => ({ name: priorityLabels[entry.priority], count: entry.count }));

  return (
    <>
      <PageHeader
        title="Rapports"
        subtitle={`Temps moyen de resolution: ${data.averageResolutionMinutes} min`}
        actions={
          <>
            <Button onClick={() => downloadFile("/reports/monthly.pdf", "rapport-mensuel.pdf")} variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />}>
              PDF mensuel
            </Button>
            <Button onClick={() => downloadFile("/reports/tickets.xlsx", "tickets.xlsx")} variant="contained" startIcon={<DownloadOutlinedIcon />}>
              Exporter Excel
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Statistiques par service" data={data.byService.map((entry) => ({ name: entry.service, count: entry.count }))} color="#1d4ed8" />
        <ChartCard title="Par type de probleme" data={typeData} color="#0f766e" />
        <ChartCard title="Par priorite" data={priorityData} color="#f59e0b" />
        <ChartCard title="Par technicien" data={data.byTechnician.map((entry) => ({ name: entry.technician, count: entry.count }))} color="#7c3aed" />
      </div>
    </>
  );
}

async function downloadFile(path: string, filename: string) {
  const response = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ChartCard({ title, data, color }: { title: string; data: { name: string; count: number }[]; color: string }) {
  return (
    <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
      <h2 className="mb-4 text-base font-bold text-slate-950">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  );
}
