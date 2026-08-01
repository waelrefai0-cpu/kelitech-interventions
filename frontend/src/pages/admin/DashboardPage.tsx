import Paper from "@mui/material/Paper";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client";
import { MetricCard } from "../../components/MetricCard";
import { PageHeader } from "../../components/PageHeader";
import { LoadingBlock } from "../../components/StateBlocks";
import { problemTypeLabels, statusLabels } from "../../data/labels";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { ProblemType, TicketStatus } from "../../types";

interface DashboardStats {
  totals: {
    totalTickets: number;
    waitingTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    urgentTickets: number;
    activeTechnicians: number;
    lowStock: number;
    averageTimeSpentMinutes: number;
  };
  byStatus: { status: TicketStatus; count: number }[];
  byType: { problemType: ProblemType; count: number }[];
  byService: { service: string; count: number }[];
}

const pieColors = ["#1d4ed8", "#0f766e", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

export function DashboardPage() {
  const { data, loading } = useAsyncData(async () => {
    const response = await api.get<DashboardStats>("/dashboard/stats");
    return response.data;
  }, []);

  if (loading) return <LoadingBlock />;
  if (!data) return null;

  const statusData = data.byStatus.map((entry) => ({ name: statusLabels[entry.status], count: entry.count }));
  const typeData = data.byType.map((entry) => ({ name: problemTypeLabels[entry.problemType], count: entry.count }));

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue globale des interventions informatiques" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total demandes" value={data.totals.totalTickets} icon={<SupportAgentOutlinedIcon />} />
        <MetricCard label="En attente" value={data.totals.waitingTickets} icon={<HourglassTopOutlinedIcon />} accent="#f59e0b" />
        <MetricCard label="En cours" value={data.totals.inProgressTickets} icon={<BuildCircleOutlinedIcon />} accent="#0ea5e9" />
        <MetricCard label="Resolus" value={data.totals.resolvedTickets} icon={<CheckCircleOutlinedIcon />} accent="#16a34a" />
        <MetricCard label="Urgents" value={data.totals.urgentTickets} icon={<PriorityHighOutlinedIcon />} accent="#dc2626" />
        <MetricCard label="Techniciens" value={data.totals.activeTechnicians} icon={<PeopleAltOutlinedIcon />} accent="#0f766e" />
        <MetricCard label="Stock faible" value={data.totals.lowStock} icon={<Inventory2OutlinedIcon />} accent="#ea580c" />
        <MetricCard label="Temps moyen" value={`${data.totals.averageTimeSpentMinutes} min`} icon={<AssessmentOutlinedIcon />} accent="#7c3aed" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-slate-950">Demandes par statut</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Paper>

        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-slate-950">Repartition par type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="count" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={3}>
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                  {entry.name}
                </span>
                <span className="font-bold text-slate-950">{entry.count}</span>
              </div>
            ))}
          </div>
        </Paper>
      </div>
    </>
  );
}
