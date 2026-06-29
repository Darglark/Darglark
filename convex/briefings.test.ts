import { afterEach, describe, expect, it, vi } from "vitest";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { create, list, remove, setCompleted } from "./briefings";

type RegisteredHandler<Ctx, Args, Result> = {
  _handler: (ctx: Ctx, args: Args) => Result | Promise<Result>;
  exportReturns: () => string;
};

type CommandBriefingDoc = {
  _id: Id<"commandBriefings">;
  _creationTime: number;
  title: string;
  doctrine: string;
  protocol: string;
  completed: boolean;
  createdAt: number;
};

type CreateArgs = {
  title: string;
  doctrine: string;
  protocol: string;
};

type SetCompletedArgs = {
  briefingId: Id<"commandBriefings">;
  completed: boolean;
};

type RemoveArgs = {
  briefingId: Id<"commandBriefings">;
};

const listHandler = (list as unknown as RegisteredHandler<QueryCtx, Record<string, never>, CommandBriefingDoc[]>)
  ._handler;
const createHandler = (create as unknown as RegisteredHandler<MutationCtx, CreateArgs, Id<"commandBriefings">>)
  ._handler;
const setCompletedHandler = (
  setCompleted as unknown as RegisteredHandler<MutationCtx, SetCompletedArgs, null>
)._handler;
const removeHandler = (remove as unknown as RegisteredHandler<MutationCtx, RemoveArgs, null>)._handler;

function briefingId(value: string) {
  return value as Id<"commandBriefings">;
}

function createBriefingDoc(index: number): CommandBriefingDoc {
  return {
    _id: briefingId(`briefing-${index}`),
    _creationTime: 1_700_000_000_000 + index,
    title: `Briefing ${index}`,
    doctrine: "Concealed Alpha Strike",
    protocol: "Secure the squad",
    completed: index % 2 === 0,
    createdAt: 1_700_000_000_000 + index,
  };
}

function createListContext(rows: CommandBriefingDoc[]) {
  const operations: {
    table?: string;
    index?: string;
    order?: "asc" | "desc";
    take?: number;
  } = {};

  const ctx = {
    db: {
      query(table: string) {
        operations.table = table;

        return {
          withIndex(index: string) {
            operations.index = index;

            return {
              order(direction: "asc" | "desc") {
                operations.order = direction;

                return {
                  async take(count: number) {
                    operations.take = count;
                    return rows.slice(0, count);
                  },
                };
              },
            };
          },
        };
      },
    },
  } as unknown as QueryCtx;

  return { ctx, operations };
}

function createMutationContext() {
  const inserted: Array<{
    table: string;
    document: Omit<CommandBriefingDoc, "_id" | "_creationTime">;
  }> = [];
  const patched: Array<{ id: Id<"commandBriefings">; patch: { completed: boolean } }> = [];
  const deleted: Id<"commandBriefings">[] = [];

  const ctx = {
    db: {
      async insert(table: string, document: Omit<CommandBriefingDoc, "_id" | "_creationTime">) {
        inserted.push({ table, document });
        return briefingId("inserted-briefing");
      },
      async patch(id: Id<"commandBriefings">, patch: { completed: boolean }) {
        patched.push({ id, patch });
      },
      async delete(id: Id<"commandBriefings">) {
        deleted.push(id);
      },
    },
  } as unknown as MutationCtx;

  return { ctx, inserted, patched, deleted };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("command briefing Convex functions", () => {
  it("declares return validators for each public briefing function", () => {
    expect(list.exportReturns()).not.toBe("null");
    expect(create.exportReturns()).not.toBe("null");
    expect(setCompleted.exportReturns()).not.toBe("null");
    expect(remove.exportReturns()).not.toBe("null");
  });

  it("lists only the latest eight briefings using the created-at index", async () => {
    const rows = Array.from({ length: 10 }, (_, index) => createBriefingDoc(index));
    const { ctx, operations } = createListContext(rows);

    const result = await listHandler(ctx, {});

    expect(operations).toEqual({
      table: "commandBriefings",
      index: "by_created_at",
      order: "desc",
      take: 8,
    });
    expect(result).toEqual(rows.slice(0, 8));
  });

  it("trims briefing titles before creating deterministic command records", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_765_432_100_000);
    const { ctx, inserted } = createMutationContext();

    const result = await createHandler(ctx, {
      title: "  Rush magnetic weapons  ",
      doctrine: "Resistance Ring Tempo",
      protocol: "Practice the response",
    });

    expect(result).toBe(briefingId("inserted-briefing"));
    expect(inserted).toEqual([
      {
        table: "commandBriefings",
        document: {
          title: "Rush magnetic weapons",
          doctrine: "Resistance Ring Tempo",
          protocol: "Practice the response",
          completed: false,
          createdAt: 1_765_432_100_000,
        },
      },
    ]);
  });

  it("rejects blank briefing titles without writing to the database", async () => {
    const { ctx, inserted } = createMutationContext();

    await expect(
      createHandler(ctx, {
        title: " \t\n ",
        doctrine: "Psi Ops Endgame",
        protocol: "Classify the contact",
      }),
    ).rejects.toThrow("Briefing title is required.");
    expect(inserted).toEqual([]);
  });

  it("patches and removes briefings by explicit briefing id", async () => {
    const { ctx, patched, deleted } = createMutationContext();
    const id = briefingId("briefing-to-update");

    await expect(setCompletedHandler(ctx, { briefingId: id, completed: true })).resolves.toBeNull();
    await expect(removeHandler(ctx, { briefingId: id })).resolves.toBeNull();

    expect(patched).toEqual([{ id, patch: { completed: true } }]);
    expect(deleted).toEqual([id]);
  });
});
