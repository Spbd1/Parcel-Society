import { prisma } from "@parcel-society/db";
import { applyAuthCookie, getParticipantAuth } from "../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../lib/api/responses";
import { comprehensionCheckSchema } from "../../../lib/api/schemas";

const correctAnswers = ["b", "c", "b", "a", "c"];

export async function GET() {
  try {
    const auth = await getParticipantAuth();
    const latest = await prisma.comprehensionCheck.findFirst({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });
    return applyAuthCookie(apiOk({ passed: latest?.passed ?? false, latest }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getParticipantAuth();
    const body = comprehensionCheckSchema.parse(await request.json());
    const score = body.answers.reduce(
      (total, answer, index) => total + (answer === correctAnswers[index] ? 1 : 0),
      0,
    );
    const passed = score === correctAnswers.length;
    const previousAttempts = await prisma.comprehensionCheck.count({
      where: { userId: auth.user.id },
    });
    const result = await prisma.comprehensionCheck.create({
      data: {
        userId: auth.user.id,
        answers: body.answers,
        score,
        passed,
        attempts: previousAttempts + 1,
      },
    });
    return applyAuthCookie(
      apiOk({ passed, score, total: correctAnswers.length, result }),
      auth,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
