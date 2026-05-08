const docs = [
  { href: "/docs/research-design.md", label: "Research design" },
  { href: "/docs/game-mechanics.md", label: "Game mechanics" },
  { href: "/docs/data-dictionary.md", label: "Data dictionary" },
  { href: "/docs/deployment.md", label: "Deployment" },
  { href: "/docs/admin-guide.md", label: "Admin guide" },
  { href: "/docs/ethics.md", label: "Ethics" },
];

export default function DocsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-950">Documentation</h1>
      <p className="text-slate-700">
        The foundation release keeps documentation as repository Markdown files.
        These links describe the intended local documents for researchers and
        contributors.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <li
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={doc.href}
          >
            <a className="font-medium text-emerald-700" href={doc.href}>
              {doc.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
