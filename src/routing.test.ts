import { describe, expect, it } from "vitest";
import { shouldRenderDarglarkingHub } from "./routing";

describe("app routing", () => {
  it("keeps the strategy app on the root URL", () => {
    expect(shouldRenderDarglarkingHub(new URL("https://example.test/"))).toBe(false);
  });

  it("renders the Darglarking hub only from explicit hub routes", () => {
    expect(shouldRenderDarglarkingHub(new URL("https://example.test/darglarking-yellow"))).toBe(true);
    expect(shouldRenderDarglarkingHub(new URL("https://example.test/?view=darglarking-yellow"))).toBe(true);
    expect(shouldRenderDarglarkingHub(new URL("https://example.test/#darglarking-yellow"))).toBe(true);
  });
});
