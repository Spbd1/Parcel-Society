import Link from "next/link";

import {
  APP_NAME,
  DEFAULT_ACTION_POINTS,
  DEFAULT_MAP_HEIGHT,
  DEFAULT_MAP_WIDTH,
  DEFAULT_SEASON_LENGTH,
} from "@parcel-society/shared";

const links = [
  { href: "/participant", label: "Participant Demo" },
  { href: "/admin", label: "Admin" },
  { href: "/docs", label: "Documentation" },
];

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Research software foundation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-700">
          Parcel Society is a minimal online behavioral-game platform for
          reproducible experiments on spatial inequality, institutional
          uncertainty, cooperation, investment, public-good contribution,
          contract reliability, rent-seeking, and exit.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Map</h2>
          <p className="mt-2 text-sm text-slate-600">
            MVP target: {DEFAULT_MAP_WIDTH}x{DEFAULT_MAP_HEIGHT} parcel
            societies.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Rounds</h2>
          <p className="mt-2 text-sm text-slate-600">
            {DEFAULT_SEASON_LENGTH} decision rounds per experimental season.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Actions</h2>
          <p className="mt-2 text-sm text-slate-600">
            {DEFAULT_ACTION_POINTS} action points per participant each round.
          </p>
        </div>
      </div>
    </section>
  );
}
