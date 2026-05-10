export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

const fallbackMessages: Record<string, string> = {
  VALIDATION_ERROR: "Check your entries and try again.",
  RATE_LIMITED: "Too many attempts. Please wait a minute and try again.",
  UNAUTHORIZED: "Admin credentials are required or incorrect.",
  FORBIDDEN: "You do not have access to that data.",
  ROUND_NOT_ACTIVE: "This round is not active right now.",
  PLAYER_EXITED: "You have exited and cannot submit more actions.",
  INSUFFICIENT_WEALTH: "You do not have enough wealth for those actions.",
  INVALID_DECISIONS: "One or more selected actions are not allowed.",
  PLAYER_ALREADY_JOINED: "You have already joined this server.",
  SERVER_NOT_WAITING: "This server is not open for new players.",
  SERVER_FULL: "This server is full.",
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(error: { code: string; message: string; details?: unknown }) {
    super(fallbackMessages[error.code] ?? error.message ?? "Request failed.");
    this.code = error.code;
    this.details = error.details;
  }
}

export const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.ok) {
    throw new ApiClientError(payload.error);
  }
  return payload.data;
};
