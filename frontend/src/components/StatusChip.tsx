import Chip from "@mui/material/Chip";
import type { TicketStatus } from "../types";
import { statusLabels } from "../data/labels";

const statusColor: Record<TicketStatus, { bg: string; fg: string }> = {
  NEW: { bg: "#dbeafe", fg: "#1d4ed8" },
  WAITING: { bg: "#fef3c7", fg: "#b45309" },
  IN_PROGRESS: { bg: "#e0f2fe", fg: "#0369a1" },
  WAITING_HARDWARE: { bg: "#ffedd5", fg: "#c2410c" },
  RESOLVED: { bg: "#dcfce7", fg: "#15803d" },
  VALIDATED: { bg: "#ccfbf1", fg: "#0f766e" },
  CLOSED: { bg: "#e2e8f0", fg: "#334155" },
  CANCELED: { bg: "#fee2e2", fg: "#b91c1c" },
};

export function StatusChip({ status }: { status: TicketStatus }) {
  const color = statusColor[status] ?? { bg: "#e2e8f0", fg: "#334155" };
  return (
    <Chip
      size="small"
      label={statusLabels[status] ?? status}
      sx={{
        minWidth: 86,
        bgcolor: color.bg,
        color: color.fg,
        fontWeight: 700,
      }}
    />
  );
}
