import { describe, expect, it } from "vitest";
import { getEntryMode } from "./entryRouting";

describe("entry routing", () => {
  it("keeps the documented strategy app on the default route", () => {
    expect(getEntryMode("/")).toBe("strategy");
  });

  it("keeps the Darglarking hub available on its own route", () => {
    expect(getEntryMode("/darglarking-yellow")).toBe("darglarkingHub");
    expect(getEntryMode("/darglarking-yellow/archive")).toBe("darglarkingHub");
  });
});
