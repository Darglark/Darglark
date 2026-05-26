import { describe, expect, it, vi } from "vitest";
import { requireBriefingMutationIdentity } from "./briefings";

describe("requireBriefingMutationIdentity", () => {
  it("rejects unauthenticated briefing mutations", async () => {
    const ctx = {
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(requireBriefingMutationIdentity(ctx)).rejects.toThrow(
      "Sign in before changing shared briefings.",
    );
  });

  it("returns the authenticated identity for authorized briefing mutations", async () => {
    const identity = {
      tokenIdentifier: "workos|commander-1",
      subject: "commander-1",
      issuer: "https://api.workos.com/",
    };
    const ctx = {
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(identity),
      },
    };

    await expect(requireBriefingMutationIdentity(ctx)).resolves.toBe(identity);
  });
});
