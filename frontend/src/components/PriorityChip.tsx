import Chip from "@mui/material/Chip";
import type { Priority } from "../types";
import { priorityLabels } from "../data/labels";

const priorityColor: Record<Priority, { bg: string; fg: string }> = {
  LOW: { bg: "#dcfce7", fg: "#15803d" },
  MEDIUM: { bg: "#fef3c7", fg: "#b45309" },
  HIGH: { bg: "#ffedd5", fg: "#c2410c" },
  URGENT: { bg: "#fee2e2", fg: "#b91c1c" },
};

export function PriorityChip({ priority }: { priority: Priority }) {
  const color = priorityColor[priority] ?? { bg: "#e2e8f0", fg: "#334155" };
  return (
    <Chip
      size="small"
      label={priorityLabels[priority] ?? priority}
      sx={{
        minWidth: 74,
        bgcolor: color.bg,
        color: color.fg,
        fontWeight: 700,
      }}
    />
  );
}
