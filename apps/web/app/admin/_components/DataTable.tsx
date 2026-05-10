"use client";

import { useMemo, useState, type ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
};

export function DataTable<T>({ rows, columns, placeholder = "Search…" }: { rows: T[]; columns: Column<T>[]; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      columns.some((column) => (column.searchValue?.(row) ?? String(column.accessor?.(row) ?? "")).toLowerCase().includes(needle)),
    );
  }, [columns, query, rows]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
        <p className="mt-2 text-xs text-slate-500">Showing {filtered.length} of {rows.length} rows</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>{columns.map((column) => <th className="px-4 py-3" key={column.key}>{column.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, index) => (
              <tr className="align-top hover:bg-slate-50" key={index}>
                {columns.map((column) => <td className="whitespace-nowrap px-4 py-3 text-slate-700" key={column.key}>{column.accessor?.(row) ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
