import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserIdentity } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { current, requireCurrentUser, storeUser } from "./users";
import { requireAdmin } from "./lib/auth";

type RegisteredHandler<Ctx, Args, Result> = {
  _handler: (ctx: Ctx, args: Args) => Result | Promise<Result>;
  exportReturns: () => string;
};

type UserDoc = Doc<"users">;
type UserInsert = Omit<UserDoc, "_id" | "_creationTime" | "updatedAt"> & {
  updatedAt?: number;
};
type UserPatch = Partial<Pick<UserDoc, "email" | "name" | "pictureUrl" | "updatedAt">>;

const storeUserHandler = (storeUser as unknown as RegisteredHandler<MutationCtx, Record<string, never>, Id<"users">>)
  ._handler;
const currentHandler = (current as unknown as RegisteredHandler<QueryCtx, Record<string, never>, UserDoc | null>)
  ._handler;
const requireCurrentUserHandler = (
  requireCurrentUser as unknown as RegisteredHandler<QueryCtx, Record<string, never>, UserDoc>
)._handler;

function userId(value: string) {
  return value as Id<"users">;
}

function createIdentity(overrides: Partial<UserIdentity> = {}): UserIdentity {
  return {
    tokenIdentifier: "issuer|commander-1",
    subject: "commander-1",
    issuer: "issuer",
    ...overrides,
  };
}

function createUserDoc(overrides: Partial<UserDoc> = {}): UserDoc {
  return {
    _id: userId("user-1"),
    _creationTime: 1_700_000_000_000,
    tokenIdentifier: "issuer|commander-1",
    name: "Existing Commander",
    email: "existing@example.com",
    pictureUrl: "https://example.com/existing.png",
    role: "user",
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

function createUserContext({
  identity,
  existingUser,
}: {
  identity: UserIdentity | null;
  existingUser: UserDoc | null;
}) {
  const inserted: Array<{ table: string; document: UserInsert }> = [];
  const patched: Array<{ id: Id<"users">; patch: UserPatch }> = [];
  const operations: {
    table?: string;
    index?: string;
    eq?: { field: string; value: string };
  } = {};

  const db = {
    query(table: string) {
      operations.table = table;

      return {
        withIndex(index: string, buildRange: (q: { eq: (field: string, value: string) => string }) => string) {
          operations.index = index;
          buildRange({
            eq(field: string, value: string) {
              operations.eq = { field, value };
              return `${field}:${value}`;
            },
          });

          return {
            async unique() {
              return existingUser;
            },
          };
        },
      };
    },
    async insert(table: string, document: UserInsert) {
      inserted.push({ table, document });
      return userId("inserted-user");
    },
    async patch(id: Id<"users">, patch: UserPatch) {
      patched.push({ id, patch });
    },
  };

  const ctx = {
    auth: {
      async getUserIdentity() {
        return identity;
      },
    },
    db,
  } as unknown as MutationCtx & QueryCtx;

  return { ctx, inserted, patched, operations };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Convex user auth functions", () => {
  it("declares return validators for each public user function", () => {
    expect(storeUser.exportReturns()).not.toBe("null");
    expect(current.exportReturns()).not.toBe("null");
    expect(requireCurrentUser.exportReturns()).not.toBe("null");
  });

  it("rejects unauthenticated profile syncs without writing user data", async () => {
    const { ctx, inserted, patched } = createUserContext({ identity: null, existingUser: null });

    await expect(storeUserHandler(ctx, {})).rejects.toThrow("Not authenticated");

    expect(inserted).toEqual([]);
    expect(patched).toEqual([]);
  });

  it("creates a default commander profile for newly authenticated identities", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_765_432_100_000);
    const { ctx, inserted, operations } = createUserContext({
      identity: createIdentity(),
      existingUser: null,
    });

    const result = await storeUserHandler(ctx, {});

    expect(result).toBe(userId("inserted-user"));
    expect(operations).toEqual({
      table: "users",
      index: "by_token",
      eq: { field: "tokenIdentifier", value: "issuer|commander-1" },
    });
    expect(inserted).toEqual([
      {
        table: "users",
        document: {
          tokenIdentifier: "issuer|commander-1",
          name: "Anonymous Commander",
          email: "",
          pictureUrl: undefined,
          role: "user",
          createdAt: 1_765_432_100_000,
        },
      },
    ]);
  });

  it("updates existing profiles without erasing optional identity fields", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_765_432_200_000);
    const existingUser = createUserDoc();
    const { ctx, inserted, patched } = createUserContext({
      identity: createIdentity({ name: "Updated Commander" }),
      existingUser,
    });

    const result = await storeUserHandler(ctx, {});

    expect(result).toBe(existingUser._id);
    expect(inserted).toEqual([]);
    expect(patched).toEqual([
      {
        id: existingUser._id,
        patch: {
          email: "existing@example.com",
          name: "Updated Commander",
          pictureUrl: "https://example.com/existing.png",
          updatedAt: 1_765_432_200_000,
        },
      },
    ]);
  });

  it("returns null for optional current-user lookups when no identity is present", async () => {
    const { ctx, operations } = createUserContext({ identity: null, existingUser: null });

    await expect(currentHandler(ctx, {})).resolves.toBeNull();
    expect(operations).toEqual({});
  });

  it("throws for required current-user lookups when identity has no stored profile", async () => {
    const { ctx } = createUserContext({
      identity: createIdentity({ tokenIdentifier: "issuer|missing-user" }),
      existingUser: null,
    });

    await expect(requireCurrentUserHandler(ctx, {})).rejects.toThrow("Not authenticated");
  });

  it("allows only admin user documents through the admin guard", async () => {
    const nonAdminContext = createUserContext({
      identity: createIdentity(),
      existingUser: createUserDoc({ role: "user" }),
    }).ctx;
    const admin = createUserDoc({ _id: userId("admin-user"), role: "admin" });
    const adminContext = createUserContext({
      identity: createIdentity(),
      existingUser: admin,
    }).ctx;

    await expect(requireAdmin(nonAdminContext)).rejects.toThrow("Admin access required");
    await expect(requireAdmin(adminContext)).resolves.toEqual(admin);
  });
});
