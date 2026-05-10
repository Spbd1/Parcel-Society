import { ApiException } from "./responses";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const clientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
};

export const rateLimit = ({
  request,
  key,
  limit,
  windowMs,
}: {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
}) => {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(request)}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiException(429, "RATE_LIMITED", "Too many requests. Please wait and try again.", {
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }
};
