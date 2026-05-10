"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { safeParseServerConfig } from "@parcel-society/shared";
import { createServerFromConfig } from "./actions";

const exampleConfig = `{
  "name": "Low inequality / stable rules",
  "description": "Baseline low-inequality treatment with stable rules and reproducible parameters.",
  "map": { "width": 10, "height": 10 },
  "season": { "rounds": 7, "actionPointsPerRound": 3 },
  "treatment": { "inequalityCondition": "LOW", "uncertaintyCondition": "STABLE" },
  "economy": {
    "initialWealth": 100,
    "initialTreasury": 500,
    "taxRate": 0.05,
    "production": { "A": 10, "betaQ": 0.8, "betaK": 0.5 },
    "safeAssetReturn": 0.02,
    "productiveInvestmentDepreciation": 0.0
  },
  "contracts": {
    "formalFeeRate": 0.08,
    "informalFeeRate": 0.02,
    "formalDefaultRisk": 0.02,
    "informalDefaultRisk": 0.15
  },
  "lobbying": { "privateReturnMultiplier": 1.15, "socialEfficiencyCost": 0.10 },
  "uncertainty": {
    "ruleChangeRounds": [3, 5],
    "possibleEvents": ["TAX_CHANGE", "FORMAL_CONTRACT_FEE_CHANGE", "SHOCK_PROBABILITY_CHANGE"]
  },
  "shocks": { "baseProbability": 0.15, "minMultiplier": 0.5, "maxMultiplier": 1.0 },
  "randomSeed": "parcel-society-lowineq-stable-v1"
}`;

export function ConfigJsonForm() {
  const [jsonText, setJsonText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => {
    if (!jsonText.trim()) {
      return { ok: false, message: "Paste JSON or upload a config file to validate it." };
    }
    try {
      const parsed = JSON.parse(jsonText);
      const result = safeParseServerConfig(parsed);
      if (result.success) {
        return {
          ok: true,
          message: `${result.data.name} is valid and can create a ${result.data.map.width}x${result.data.map.height} ${result.data.treatment.inequalityCondition}/${result.data.treatment.uncertaintyCondition} server.`,
        };
      }
      return {
        ok: false,
        message: result.error.issues
          .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
          .join("; "),
      };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Invalid JSON." };
    }
  }, [jsonText]);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setJsonText(await file.text());
  };

  return (
    <form action={createServerFromConfig} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Create from JSON config</h2>
          <p className="mt-1 text-sm text-slate-600">Paste or upload one reproducible config, validate it locally, then create a draft server with its map.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setJsonText(exampleConfig)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Upload JSON
          </button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onUpload} className="hidden" />
      <textarea
        name="configJson"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        className="mt-4 h-80 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
        placeholder="Paste a Parcel Society JSON config here…"
        required
      />
      <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${validation.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
        {validation.message}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          name="intent"
          value="draft"
          disabled={!validation.ok}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Draft from Config
        </button>
        <button
          name="intent"
          value="generate"
          disabled={!validation.ok}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create and Generate Map
        </button>
      </div>
    </form>
  );
}
