import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { requireBriefingMutationAccess } from "./briefings";

describe("briefing mutation authorization", () => {
  it("rejects unauthenticated briefing writes", async () => {
    const ctx = {
      auth: {
        getUserIdentity: async () => null,
      },
    };

    await expect(requireBriefingMutationAccess(ctx as never)).rejects.toThrow("Not authenticated");
  });

  it("guards every public briefing mutation handler", () => {
    const source = readFileSync(new URL("./briefings.ts", import.meta.url), "utf8");

    expect(source.match(/await requireBriefingMutationAccess\(ctx\);/g)).toHaveLength(3);
  });
});
