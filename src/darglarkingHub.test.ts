/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

describe("Darglarking Yellow hub", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("toggles the hidden addendum and keeps aria-expanded in sync", () => {
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const trigger = root.querySelector<HTMLButtonElement>(".dy-pixel-trigger");
    const hiddenLore = root.querySelector<HTMLDivElement>("#pixel-lore");

    expect(trigger).not.toBeNull();
    expect(hiddenLore).not.toBeNull();
    expect(hiddenLore?.hidden).toBe(true);
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");

    trigger?.click();

    expect(hiddenLore?.hidden).toBe(false);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    trigger?.click();

    expect(hiddenLore?.hidden).toBe(true);
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("rejects non-PNG uploads before attempting image decoding", () => {
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const fileInput = root.querySelector<HTMLInputElement>(".dy-file-input");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");

    expect(fileInput).not.toBeNull();
    expect(status).not.toBeNull();

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["yellow"], "yellow-note.txt", { type: "text/plain" })],
    });

    fileInput?.dispatchEvent(new Event("change"));

    expect(status?.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status?.dataset.variant).toBe("error");
  });
});
