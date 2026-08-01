import Paper from "@mui/material/Paper";
import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import { roleLabels } from "../../data/labels";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Compte municipal" />
      <Paper elevation={0} className="max-w-2xl rounded-lg border border-slate-200 p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <Info label="Nom" value={user ? `${user.firstName} ${user.lastName}` : "-"} />
          <Info label="Role" value={user ? roleLabels[user.role] : "-"} />
          <Info label="Courriel" value={user?.email ?? "-"} />
          <Info label="Service" value={user?.service?.name ?? "-"} />
          <Info label="Telephone" value={user?.phone ?? "-"} />
        </div>
      </Paper>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
