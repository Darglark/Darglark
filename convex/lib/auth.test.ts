import { describe, expect, it, vi } from "vitest";
import { getCurrentUser, getCurrentUserOrNull, requireAdmin } from "./auth";

type MockIdentity = {
  tokenIdentifier: string;
};

type MockUser = {
  _id: string;
  tokenIdentifier: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

function createAuthCtx(identity: MockIdentity | null, user: MockUser | null) {
  const eq = vi.fn().mockReturnValue("token-match");
  const unique = vi.fn().mockResolvedValue(user);
  const withIndex = vi.fn((indexName: string, buildQuery: (q: { eq: typeof eq }) => unknown) => {
    buildQuery({ eq });
    return { unique };
  });
  const query = vi.fn().mockReturnValue({ withIndex });

  return {
    ctx: {
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(identity),
      },
      db: {
        query,
      },
    },
    eq,
    query,
    unique,
    withIndex,
  };
}

describe("Convex auth helpers", () => {
  it("returns null without touching the users table when no identity is present", async () => {
    const { ctx, query } = createAuthCtx(null, null);

    await expect(getCurrentUserOrNull(ctx as never)).resolves.toBeNull();

    expect(query).not.toHaveBeenCalled();
  });

  it("loads the current user by token identifier", async () => {
    const identity = { tokenIdentifier: "workos|commander-1" };
    const user: MockUser = {
      _id: "users:commander-1",
      tokenIdentifier: identity.tokenIdentifier,
      email: "commander@example.com",
      name: "Commander",
      role: "user",
    };
    const { ctx, eq, query, unique, withIndex } = createAuthCtx(identity, user);

    await expect(getCurrentUserOrNull(ctx as never)).resolves.toBe(user);

    expect(query).toHaveBeenCalledWith("users");
    expect(withIndex).toHaveBeenCalledWith("by_token", expect.any(Function));
    expect(eq).toHaveBeenCalledWith("tokenIdentifier", identity.tokenIdentifier);
    expect(unique).toHaveBeenCalledTimes(1);
  });

  it("rejects protected access when the identity has not been stored", async () => {
    const { ctx } = createAuthCtx({ tokenIdentifier: "workos|missing" }, null);

    await expect(getCurrentUser(ctx as never)).rejects.toThrow("Not authenticated");
  });

  it("allows only stored admins through requireAdmin", async () => {
    const admin: MockUser = {
      _id: "users:admin",
      tokenIdentifier: "workos|admin",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    };
    const nonAdmin: MockUser = {
      ...admin,
      _id: "users:user",
      role: "user",
    };

    await expect(requireAdmin(createAuthCtx({ tokenIdentifier: admin.tokenIdentifier }, admin).ctx as never)).resolves.toBe(
      admin,
    );
    await expect(
      requireAdmin(createAuthCtx({ tokenIdentifier: nonAdmin.tokenIdentifier }, nonAdmin).ctx as never),
    ).rejects.toThrow("Admin access required");
  });
});
