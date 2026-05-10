import { AdminPageHeader } from "../../_components/ui";
import { ConfigJsonForm } from "./ConfigJsonForm";
import { createServer } from "./actions";

export default function NewServerPage() {
  return (
    <>
      <AdminPageHeader title="Create server" description="Create a draft experiment server manually or from a reproducible JSON config." />
      <ConfigJsonForm />
      <form action={createServer} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 text-sm font-medium text-slate-700">Name<input name="name" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">Description<textarea name="description" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} /></label>
          <label className="text-sm font-medium text-slate-700">Max players<input name="maxPlayers" type="number" defaultValue={20} min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Season length<input name="seasonLength" type="number" defaultValue={7} min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Inequality condition<select name="inequalityCondition" defaultValue="LOW" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option>LOW</option><option>HIGH</option></select></label>
          <label className="text-sm font-medium text-slate-700">Uncertainty condition<select name="uncertaintyCondition" defaultValue="STABLE" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option>STABLE</option><option>UNCERTAIN</option></select></label>
          <label className="text-sm font-medium text-slate-700">Random seed<input name="randomSeed" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Auto-generated if empty" /></label>
          <label className="text-sm font-medium text-slate-700">Initial treasury<input name="initialTreasury" type="number" step="0.01" defaultValue={0} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Tax rate<input name="taxRate" type="number" step="0.01" defaultValue={0.15} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Formal contract fee<input name="formalContractFee" type="number" step="0.01" defaultValue={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Informal contract fee<input name="informalContractFee" type="number" step="0.01" defaultValue={0} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Shock probability<input name="shockProbability" type="number" step="0.01" defaultValue={0.1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button name="intent" value="draft" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Create Draft Server</button>
          <button name="intent" value="generate" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Create and Generate Map</button>
        </div>
      </form>
    </>
  );
}
