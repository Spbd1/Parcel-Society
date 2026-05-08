import Link from "next/link";

import { APP_NAME } from "@parcel-society/shared";

const highlights = [
  "Make choices over 7 short rounds.",
  "Use 3 action points each round.",
  "Balance private investment, public contribution, contracts, lobbying, and exit.",
];

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Participant research game
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          Parcel Society is a simple online decision game about land parcels,
          investment, cooperation, rules, and uncertainty. You will manage one
          parcel, make round-by-round decisions, and see how your choices affect
          your standing and the server as a whole.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-lg bg-emerald-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-800"
            href="/tutorial"
          >
            Join Available Server
          </Link>
          <Link
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
            href="/admin"
          >
            Admin Login
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5" key={highlight}>
            <p className="text-sm leading-6 text-slate-700">{highlight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
