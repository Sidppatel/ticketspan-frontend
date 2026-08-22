interface MetricCardProps {
  label: string;
  value: string;
  changePercent: number | null;
  hint?: string;
}

export function MetricCard({ label, value, changePercent, hint }: MetricCardProps) {
  const positive = changePercent !== null && changePercent >= 0;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs">
        {changePercent === null ? (
          <span className="text-muted-foreground">— vs previous period</span>
        ) : (
          <span className={positive ? 'text-success' : 'text-destructive'}>
            {positive ? '▲' : '▼'} {Math.abs(changePercent)}% vs previous period
          </span>
        )}
        {hint ? <span className="ml-1 text-muted-foreground">{hint}</span> : null}
      </p>
    </div>
  );
}
