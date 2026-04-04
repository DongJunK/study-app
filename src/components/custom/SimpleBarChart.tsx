"use client";

interface BarData {
  label: string;
  value: number;
  maxValue: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  color?: string;
  emptyMessage?: string;
}

export function SimpleBarChart({ data, color = "bg-primary", emptyMessage = "데이터가 없습니다" }: SimpleBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
    );
  }

  const maxVal = Math.max(...data.map(d => d.maxValue), 1);

  return (
    <div className="space-y-2">
      {data.slice(-10).map((item, i) => {
        const pct = Math.round((item.value / maxVal) * 100);
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-16 text-xs text-muted-foreground truncate text-right">{item.label}</span>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="w-10 text-xs font-medium text-right">{item.value}%</span>
          </div>
        );
      })}
    </div>
  );
}
