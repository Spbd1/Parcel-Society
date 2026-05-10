import Link from "next/link";
import type { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  WAITING: "bg-amber-100 text-amber-800 ring-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-blue-100 text-blue-800 ring-blue-200",
  ARCHIVED: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

const conditionStyles: Record<string, string> = {
  LOW: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  HIGH: "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200",
  STABLE: "bg-green-50 text-green-800 ring-green-200",
  UNCERTAIN: "bg-orange-50 text-orange-800 ring-orange-200",
};

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function ServerStatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusStyles[status] ?? statusStyles.DRAFT}`}>{status}</span>;
}

export function ConditionBadge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${conditionStyles[value] ?? conditionStyles.STABLE}`}>{value}</span>;
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <Card className="py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p> : null}
      {actionHref && actionLabel ? <Link className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href={actionHref}>{actionLabel}</Link> : null}
    </Card>
  );
}

export function LoadingState() {
  return <Card><p className="animate-pulse text-sm text-slate-600">Loading admin data…</p></Card>;
}

export function ErrorState({ message }: { message: string }) {
  return <Card className="border-red-200 bg-red-50"><p className="text-sm font-medium text-red-800">{message}</p></Card>;
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return <Link className={variant === "primary" ? "rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"} href={href}>{children}</Link>;
}
