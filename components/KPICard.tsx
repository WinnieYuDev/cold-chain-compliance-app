"use client";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantClasses = {
  default: "border-slate-600 bg-slate-800/50",
  success: "border-success/50 bg-success/10",
  warning: "border-warning/50 bg-warning/10",
  danger: "border-danger/50 bg-danger/10",
};

export function KPICard({ title, value, subtitle, variant = "default" }: KPICardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-lg ${variantClasses[variant]}`}
    >
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
