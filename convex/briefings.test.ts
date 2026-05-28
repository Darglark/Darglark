import { describe, expect, it, vi } from "vitest";
import { create, remove, setCompleted } from "./briefings";

type MutationWithHandler = {
  _handler: (ctx: unknown, args: unknown) => Promise<unknown>;
};

function mutationHandler(mutation: unknown) {
  return (mutation as MutationWithHandler)._handler;
}

function unauthenticatedMutationCtx() {
  return {
    auth: {
      getUserIdentity: vi.fn(async () => null),
    },
    db: {
      insert: vi.fn(async () => "briefing-id"),
      patch: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    },
  };
}

describe("briefing mutations", () => {
  it("rejects unauthenticated briefing creation before writing", async () => {
    const ctx = unauthenticatedMutationCtx();

    await expect(
      mutationHandler(create)(ctx, {
        title: "Rush magnetic weapons",
        doctrine: "Concealed Alpha Strike",
        protocol: "Secure the squad",
      }),
    ).rejects.toThrow("Sign in before changing shared briefings.");

    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated briefing updates before writing", async () => {
    const ctx = unauthenticatedMutationCtx();

    await expect(
      mutationHandler(setCompleted)(ctx, {
        briefingId: "briefing-id",
        completed: true,
      }),
    ).rejects.toThrow("Sign in before changing shared briefings.");

    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated briefing deletion before writing", async () => {
    const ctx = unauthenticatedMutationCtx();

    await expect(
      mutationHandler(remove)(ctx, {
        briefingId: "briefing-id",
      }),
    ).rejects.toThrow("Sign in before changing shared briefings.");

    expect(ctx.db.delete).not.toHaveBeenCalled();
  });
});
