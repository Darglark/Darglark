import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("document metadata", () => {
  it("describes the default Shadow Chamber Command app", () => {
    const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    expect(indexHtml).toContain("<title>Shadow Chamber Command</title>");
    expect(indexHtml).toContain("XCOM 2: War of the Chosen strategy recommendations");
  });
});
