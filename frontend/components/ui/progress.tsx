interface ProgressProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1">
      {label ? <p className="text-sm text-slate-600">{label}</p> : null}
      <div className="h-3 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
