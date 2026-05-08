"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { requestJson } from "../components/api";

type Server = {
  id: string;
  name: string;
  description: string | null;
  inequalityCondition: "LOW" | "HIGH";
  uncertaintyCondition: "STABLE" | "UNCERTAIN";
  maxPlayers: number;
  seasonLength: number;
  _count: { players: number; parcels: number };
};

type AvailableServers = { servers: Server[] };

export default function JoinPage() {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestJson<AvailableServers>("/api/servers/available")
      .then((data) => setServers(data.servers))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load servers."))
      .finally(() => setLoading(false));
  }, []);

  const join = async (serverId: string) => {
    setJoining(serverId);
    setError(null);
    try {
      await requestJson("/api/join-server", {
        method: "POST",
        body: JSON.stringify({ serverId }),
      });
      router.push(`/game/${serverId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join server.");
    } finally {
      setJoining(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-bold text-slate-950">Join an Available Server</h1>
        <p className="mt-3 text-slate-700">
          Choose a waiting research server. You must pass the comprehension check before joining.
        </p>
      </div>

      {loading ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">Loading available servers...</p> : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          {error.includes("comprehension") || error.includes("Pass") ? (
            <Link className="mt-2 inline-flex font-semibold underline" href="/comprehension-check">Go to comprehension check</Link>
          ) : null}
        </div>
      ) : null}

      {!loading && servers.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
          No waiting servers are available right now. Please check with the researcher or try again later.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {servers.map((server) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={server.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{server.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{server.description ?? "No description provided."}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {server._count.players}/{server.maxPlayers}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Inequality</dt><dd className="font-semibold text-slate-900">{server.inequalityCondition}</dd></div>
              <div><dt className="text-slate-500">Institution</dt><dd className="font-semibold text-slate-900">{server.uncertaintyCondition}</dd></div>
              <div><dt className="text-slate-500">Rounds</dt><dd className="font-semibold text-slate-900">{server.seasonLength}</dd></div>
              <div><dt className="text-slate-500">Parcels</dt><dd className="font-semibold text-slate-900">{server._count.parcels}</dd></div>
            </dl>
            <button
              className="mt-5 w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400"
              disabled={joining === server.id || server._count.players >= server.maxPlayers}
              onClick={() => join(server.id)}
              type="button"
            >
              {joining === server.id ? "Joining..." : "Join Server"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
