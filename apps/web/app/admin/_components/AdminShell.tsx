"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/servers", "Servers"],
  ["/admin/exports", "Exports"],
  ["/admin/audit-log", "Audit log"],
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-fit">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parcel Society</p>
          <p className="text-lg font-bold text-slate-950">Admin</p>
        </div>
        <nav className="space-y-1">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`block rounded-lg px-3 py-2 text-sm font-medium ${pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</Link>
          ))}
        </nav>
        <Link href="/admin/login" className="mt-4 block rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700">API login</Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
