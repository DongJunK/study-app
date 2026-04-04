"use client";

import type { WeaknessStatus } from "@/types/weakness";

interface WeaknessTagProps {
  concept: string;
  status: WeaknessStatus;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  WeaknessStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  unknown: {
    label: "모른다",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
  },
  confused: {
    label: "헷갈림",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  understood: {
    label: "이해함",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
};

export function WeaknessTag({ concept, status, onClick }: WeaknessTagProps) {
  const config = STATUS_CONFIG[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all hover:scale-105 hover:shadow-sm ${config.bg} ${config.text} ${config.border} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span
        className={`size-2 rounded-full ${
          status === "unknown"
            ? "bg-red-500"
            : status === "confused"
              ? "bg-amber-500"
              : "bg-emerald-500"
        }`}
      />
      <span>{concept}</span>
      <span className="opacity-70">({config.label})</span>
    </button>
  );
}
