// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

describe("Darglarking Yellow hub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  function renderHub() {
    const root = document.createElement("div");
    document.body.append(root);

    renderDarglarkingHub(root);

    return root;
  }

  it("toggles the hidden pixel transcript and keeps aria-expanded synchronized", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);

    const root = renderHub();
    const pixelTrigger = root.querySelector<HTMLButtonElement>(".dy-pixel-trigger");
    const hiddenLore = root.querySelector<HTMLDivElement>("#pixel-lore");

    expect(pixelTrigger).not.toBeNull();
    expect(hiddenLore).not.toBeNull();
    expect(hiddenLore?.hidden).toBe(true);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("false");

    pixelTrigger?.click();

    expect(hiddenLore?.hidden).toBe(false);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("true");

    pixelTrigger?.click();

    expect(hiddenLore?.hidden).toBe(true);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("announces an error when the steganography canvas context is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const root = renderHub();
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");

    expect(status?.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status?.dataset.variant).toBe("error");
  });

  it("rejects non-PNG uploads before attempting to read image data", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);

    const root = renderHub();
    const fileInput = root.querySelector<HTMLInputElement>(".dy-file-input");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");
    const downloadLink = root.querySelector<HTMLAnchorElement>(".dy-download-link");

    expect(fileInput).not.toBeNull();

    const file = new File(["not a png"], "field-notes.txt", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [file],
    });

    fileInput?.dispatchEvent(new Event("change"));

    expect(downloadLink?.hidden).toBe(true);
    expect(status?.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status?.dataset.variant).toBe("error");
  });
});
