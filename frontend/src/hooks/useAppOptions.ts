import { useMemo } from "react";
import { api } from "../api/client";
import { priorityLabels, problemTypeLabels, statusLabels } from "../data/labels";
import { useAsyncData } from "./useAsyncData";
import type { AppOption, OptionCategory, Priority, ProblemType, TicketStatus } from "../types";

const fallbackLabels = {
  status: statusLabels,
  priority: priorityLabels,
  problemType: problemTypeLabels,
};

export function useAppOptions() {
  const { data, loading, refresh } = useAsyncData(async () => {
    const response = await api.get<AppOption[]>("/options");
    return response.data;
  }, []);

  const helpers = useMemo(() => {
    const options = data ?? [];

    function byCategory<T extends string>(category: OptionCategory, fallback: Record<T, string>) {
      const items = options.filter((option) => option.category === category && option.isActive);
      return items.length
        ? items.map((option) => ({ value: option.value as T, label: option.label }))
        : Object.entries(fallback).map(([value, label]) => ({ value: value as T, label: label as string }));
    }

    function labelsFor<T extends string>(category: OptionCategory, fallback: Record<T, string>) {
      return byCategory(category, fallback).reduce(
        (acc, option) => ({
          ...acc,
          [option.value]: option.label,
        }),
        { ...fallback },
      );
    }

    return {
      all: options,
      statusOptions: byCategory<TicketStatus>("status", fallbackLabels.status),
      priorityOptions: byCategory<Priority>("priority", fallbackLabels.priority),
      problemTypeOptions: byCategory<ProblemType>("problemType", fallbackLabels.problemType),
      statusLabels: labelsFor<TicketStatus>("status", fallbackLabels.status),
      priorityLabels: labelsFor<Priority>("priority", fallbackLabels.priority),
      problemTypeLabels: labelsFor<ProblemType>("problemType", fallbackLabels.problemType),
    };
  }, [data]);

  return { ...helpers, loading, refresh };
}
