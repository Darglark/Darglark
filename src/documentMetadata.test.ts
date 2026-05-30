import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

describe("document metadata", () => {
  it("describes the default Shadow Chamber Command app", () => {
    expect(indexHtml).toContain("<title>Shadow Chamber Command</title>");
    expect(indexHtml).toContain("XCOM 2: War of the Chosen strategy recommendations");
  });
});
