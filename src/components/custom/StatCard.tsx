"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  iconClassName?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 flex items-center gap-4",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 size-10 rounded-lg flex items-center justify-center",
          iconClassName
        )}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate">
          {label}
        </p>
        <div className="flex items-end gap-2 mt-0.5">
          <p className="text-2xl font-bold leading-tight text-foreground">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium mb-0.5",
                trend.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
