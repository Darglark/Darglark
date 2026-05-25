import { describe, expect, it, vi } from "vitest";
import type { Doc } from "../convex/_generated/dataModel";
import { getCurrentUser, getCurrentUserOrNull, requireAdmin } from "../convex/lib/auth";

type FakeIdentity = {
  tokenIdentifier: string;
};

type FakeUser = Doc<"users">;
type AuthCtx = Parameters<typeof getCurrentUserOrNull>[0];

function createUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    _id: "users:1" as FakeUser["_id"],
    _creationTime: 1,
    tokenIdentifier: "issuer|commander",
    name: "Jane Commander",
    email: "jane@example.com",
    role: "user",
    createdAt: 1,
    ...overrides,
  };
}

function createCtx({ identity, user }: { identity: FakeIdentity | null; user: FakeUser | null }) {
  const unique = vi.fn(async () => user);
  const eq = vi.fn(() => "token-filter");
  const withIndex = vi.fn((_indexName: string, buildQuery: (q: { eq: typeof eq }) => unknown) => {
    buildQuery({ eq });
    return { unique };
  });
  const query = vi.fn(() => ({ withIndex }));

  return {
    auth: {
      getUserIdentity: vi.fn(async () => identity),
    },
    db: {
      query,
    },
    spies: {
      eq,
      query,
      unique,
      withIndex,
    },
  };
}

function asAuthCtx(ctx: ReturnType<typeof createCtx>): AuthCtx {
  return ctx as unknown as AuthCtx;
}

describe("Convex auth helpers", () => {
  it("returns null without querying users when no identity is authenticated", async () => {
    const ctx = createCtx({ identity: null, user: null });

    await expect(getCurrentUserOrNull(asAuthCtx(ctx))).resolves.toBeNull();

    expect(ctx.spies.query).not.toHaveBeenCalled();
  });

  it("loads the persisted user by token identifier", async () => {
    const user = createUser();
    const ctx = createCtx({
      identity: { tokenIdentifier: user.tokenIdentifier },
      user,
    });

    await expect(getCurrentUserOrNull(asAuthCtx(ctx))).resolves.toBe(user);

    expect(ctx.spies.query).toHaveBeenCalledWith("users");
    expect(ctx.spies.withIndex).toHaveBeenCalledWith("by_token", expect.any(Function));
    expect(ctx.spies.eq).toHaveBeenCalledWith("tokenIdentifier", user.tokenIdentifier);
  });

  it("rejects protected access when the authenticated identity has no stored user", async () => {
    const ctx = createCtx({
      identity: { tokenIdentifier: "issuer|new-commander" },
      user: null,
    });

    await expect(getCurrentUser(asAuthCtx(ctx))).rejects.toThrow("Not authenticated");
  });

  it("allows admins through requireAdmin", async () => {
    const admin = createUser({ role: "admin" });
    const ctx = createCtx({
      identity: { tokenIdentifier: admin.tokenIdentifier },
      user: admin,
    });

    await expect(requireAdmin(asAuthCtx(ctx))).resolves.toBe(admin);
  });

  it("rejects non-admin users from requireAdmin", async () => {
    const ctx = createCtx({
      identity: { tokenIdentifier: "issuer|standard-commander" },
      user: createUser({ role: "user" }),
    });

    await expect(requireAdmin(asAuthCtx(ctx))).rejects.toThrow("Admin access required");
  });
});
