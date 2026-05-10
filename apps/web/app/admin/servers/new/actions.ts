"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { InequalityCondition, prisma, ServerStatus, UncertaintyCondition } from "@parcel-society/db";
import { createServerMap } from "../../../../lib/services/game";

const num = (formData: FormData, key: string, fallback = 0) => Number(formData.get(key) || fallback);

export async function createServer(formData: FormData) {
  const generateMap = formData.get("intent") === "generate";
  const config = {
    taxRate: num(formData, "taxRate", 0.15),
    formalContractFee: num(formData, "formalContractFee", 2),
    informalContractFee: num(formData, "informalContractFee", 0),
    shockProbability: num(formData, "shockProbability", 0.1),
  };
  const server = await prisma.server.create({
    data: {
      name: String(formData.get("name") || "Untitled server"),
      description: String(formData.get("description") || ""),
      maxPlayers: num(formData, "maxPlayers", 20),
      seasonLength: num(formData, "seasonLength", 7),
      inequalityCondition: String(formData.get("inequalityCondition")) as InequalityCondition,
      uncertaintyCondition: String(formData.get("uncertaintyCondition")) as UncertaintyCondition,
      randomSeed: String(formData.get("randomSeed") || randomUUID()),
      treasury: num(formData, "initialTreasury", 0),
      config,
      status: ServerStatus.DRAFT,
    },
  });
  if (generateMap) await createServerMap({ serverId: server.id, width: 10, height: 10 });
  redirect(`/admin/servers/${server.id}`);
}
