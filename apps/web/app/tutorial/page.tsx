import Link from "next/link";

const topics = [
  ["Parcels", "Each participant manages one parcel on a 10x10 server map. Parcel quality affects production."],
  ["7 rounds", "A season lasts 7 decision rounds. Each round has fresh choices and a status update."],
  ["3 action points", "You can select up to 3 actions each round. Every selected action costs 1 action point."],
  ["Productive investment", "Spend wealth to build productive capital that can improve future output."],
  ["Safe asset", "Move wealth into a lower-risk safe asset with a small return."],
  ["Public contribution", "Contribute to the treasury for shared server-level outcomes."],
  ["Informal vs formal contracts", "Informal contracts have no fee but higher default risk. Formal contracts charge a fee and have lower default risk."],
  ["Lobbying", "Spend resources trying to influence rules or outcomes."],
  ["Exit", "Leave the season if you no longer want to make further round decisions."],
];

export default function TutorialPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Tutorial</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">How Parcel Society works</h1>
        <p className="mt-4 max-w-3xl text-slate-700">
          Read this short overview before entering a research server. The goal is to understand the choices available to you, not to memorize exact formulas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map(([title, body]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5" key={title}>
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
          </article>
        ))}
      </div>

      <Link
        className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        href="/comprehension-check"
      >
        Start Comprehension Check
      </Link>
    </section>
  );
}
