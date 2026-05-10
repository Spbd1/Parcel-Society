import { ActionType } from "@parcel-society/db";
import { applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema, submitDecisionsSchema } from "../../../../../lib/api/schemas";
import { submitPlayerDecisions } from "../../../../../lib/services/game";
import { rateLimit } from "../../../../../lib/api/rateLimit";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    rateLimit({ request, key: "decision-submission", limit: 30, windowMs: 60_000 });
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const body = submitDecisionsSchema.parse(await request.json());
    const result = await submitPlayerDecisions({
      userId: auth.user.id,
      serverId,
      decisions: body.decisions.map((decision) => ({
        ...decision,
        type: decision.type as ActionType,
      })),
    });
    return applyAuthCookie(apiOk(result), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
