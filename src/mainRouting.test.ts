import { describe, expect, it } from "vitest";
import { getInitialExperience } from "./mainRouting";

describe("main routing", () => {
  it("renders the documented XCOM command app by default", () => {
    expect(getInitialExperience("")).toBe("xcom");
  });

  it("keeps the Darglarking hub available behind an explicit hash route", () => {
    expect(getInitialExperience("#darglarking-yellow")).toBe("darglarking");
  });
});
