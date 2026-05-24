import { describe, expect, it, vi } from "vitest";
import { getCurrentUser, getCurrentUserOrNull, requireAdmin } from "./auth";

type AuthHelperContext = Parameters<typeof getCurrentUserOrNull>[0];

type TestIdentity = {
  tokenIdentifier: string;
};

type TestUser = {
  _id: string;
  _creationTime: number;
  tokenIdentifier: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: number;
};

function createUser(role: "user" | "admin" = "user"): TestUser {
  return {
    _id: "users:test-user",
    _creationTime: 1,
    tokenIdentifier: "issuer|commander-1",
    name: "Jane Commander",
    email: "commander@example.com",
    role,
    createdAt: 1,
  };
}

function createAuthContext(identity: TestIdentity | null, user: TestUser | null) {
  const eq = vi.fn(() => "token-filter");
  const unique = vi.fn(async () => user);
  const withIndex = vi.fn((indexName: string, applyIndex: (q: { eq: typeof eq }) => unknown) => {
    applyIndex({ eq });
    return { unique };
  });
  const query = vi.fn(() => ({ withIndex }));
  const getUserIdentity = vi.fn(async () => identity);

  return {
    ctx: {
      auth: { getUserIdentity },
      db: { query },
    },
    eq,
    getUserIdentity,
    query,
    unique,
    withIndex,
  };
}

describe("Convex auth helpers", () => {
  it("does not query users when the request has no authenticated identity", async () => {
    const { ctx, getUserIdentity, query } = createAuthContext(null, null);

    await expect(getCurrentUserOrNull(ctx as AuthHelperContext)).resolves.toBeNull();

    expect(getUserIdentity).toHaveBeenCalledOnce();
    expect(query).not.toHaveBeenCalled();
  });

  it("looks up the current user by token identifier", async () => {
    const identity = { tokenIdentifier: "issuer|commander-1" };
    const user = createUser();
    const { ctx, eq, query, unique, withIndex } = createAuthContext(identity, user);

    await expect(getCurrentUserOrNull(ctx as AuthHelperContext)).resolves.toBe(user);

    expect(query).toHaveBeenCalledWith("users");
    expect(withIndex).toHaveBeenCalledWith("by_token", expect.any(Function));
    expect(eq).toHaveBeenCalledWith("tokenIdentifier", identity.tokenIdentifier);
    expect(unique).toHaveBeenCalledOnce();
  });

  it("requires an authenticated user before returning protected data", async () => {
    const { ctx } = createAuthContext({ tokenIdentifier: "issuer|missing" }, null);

    await expect(getCurrentUser(ctx as AuthHelperContext)).rejects.toThrow("Not authenticated");
  });

  it("rejects non-admin users from admin-only flows", async () => {
    const { ctx } = createAuthContext({ tokenIdentifier: "issuer|commander-1" }, createUser("user"));

    await expect(requireAdmin(ctx as AuthHelperContext)).rejects.toThrow("Admin access required");
  });

  it("returns admin users for admin-only flows", async () => {
    const admin = createUser("admin");
    const { ctx } = createAuthContext({ tokenIdentifier: "issuer|commander-1" }, admin);

    await expect(requireAdmin(ctx as AuthHelperContext)).resolves.toBe(admin);
  });
});
