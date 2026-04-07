"use client";

import { CircleHelp, CircleAlert, CircleCheck } from "lucide-react";
import type { WeaknessStatus } from "@/types/weakness";

interface WeaknessTagProps {
  concept: string;
  status: WeaknessStatus;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  WeaknessStatus,
  { icon: typeof CircleHelp; bg: string; text: string; border: string; iconColor: string }
> = {
  unknown: {
    icon: CircleAlert,
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    iconColor: "text-amber-500",
  },
  confused: {
    icon: CircleHelp,
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    iconColor: "text-orange-500",
  },
  understood: {
    icon: CircleCheck,
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-500",
  },
};

export function WeaknessTag({ concept, status, onClick }: WeaknessTagProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all hover:scale-105 hover:shadow-sm ${config.bg} ${config.text} ${config.border} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <Icon className={`size-3.5 ${config.iconColor}`} />
      <span>{concept}</span>
    </button>
  );
}
