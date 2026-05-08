import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export class ApiException extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiOk = <T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> =>
  NextResponse.json({ ok: true, data }, init);

export const apiError = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiResponse<never>> =>
  NextResponse.json({ ok: false, error: { code, message, details } }, { status });

export const handleApiError = (error: unknown): NextResponse<ApiResponse<never>> => {
  if (error instanceof ApiException) {
    return apiError(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return apiError(400, "VALIDATION_ERROR", "Request validation failed.", error.flatten());
  }

  console.error(error);
  return apiError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
};
