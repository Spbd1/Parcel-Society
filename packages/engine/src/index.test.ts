import { describe, expect, it } from "vitest";

import { ENGINE_PACKAGE_READY, type ActionType } from "./index";

describe("engine package", () => {
  it("exports initial research action types", () => {
    const action: ActionType = "PRODUCE";

    expect(action).toBe("PRODUCE");
    expect(ENGINE_PACKAGE_READY).toBe(true);
  });
});
