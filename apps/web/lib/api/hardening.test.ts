import { describe, expect, it } from "vitest";
import { ApiException } from "./responses";
import { rateLimit } from "./rateLimit";
import { createServerSchema, joinServerSchema, submitDecisionsSchema } from "./schemas";

const requestFrom = (ip: string) => new Request("https://example.test/api", { headers: { "x-forwarded-for": ip } });

describe("API hardening schemas", () => {
  it("rejects duplicate or unknown join payload fields", () => {
    expect(() => joinServerSchema.parse({ serverId: "server-1", extra: true })).toThrow();
  });

  it("limits decision submissions to three action points", () => {
    expect(() =>
      submitDecisionsSchema.parse({
        decisions: [
          { type: "PRODUCE", parcelId: "p1" },
          { type: "SAFE_ASSET", amount: 1 },
          { type: "PUBLIC_CONTRIBUTION", amount: 1 },
          { type: "LOBBYING", amount: 1 },
        ],
      }),
    ).toThrow();
  });

  it("rejects malformed server creation inputs", () => {
    expect(() => createServerSchema.parse({ name: "", maxPlayers: 0 })).toThrow();
  });
});

describe("rate limiting", () => {
  it("throws a consistent API exception after the limit", () => {
    const request = requestFrom("203.0.113.10");
    rateLimit({ request, key: "test-login", limit: 1, windowMs: 60_000 });
    expect(() => rateLimit({ request, key: "test-login", limit: 1, windowMs: 60_000 })).toThrow(ApiException);
  });
});
