import CircularProgress from "@mui/material/CircularProgress";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

export function LoadingBlock({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <CircularProgress size={20} />
        {label}
      </div>
    </div>
  );
}

export function EmptyBlock({ label = "Aucune donnee" }: { label?: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-white">
      <div className="text-center text-slate-500">
        <InboxOutlinedIcon />
        <p className="mt-2 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

