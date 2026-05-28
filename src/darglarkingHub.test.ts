/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function getElement<T extends Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}

describe("Darglarking Yellow hub", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.append(root);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it("keeps the hidden addendum disclosure state and aria-expanded value in sync", () => {
    renderDarglarkingHub(root);

    const pixelTrigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getElement<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger).toHaveAttribute("aria-expanded", "false");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(pixelTrigger).toHaveAttribute("aria-expanded", "true");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("blocks encoding before a PNG is loaded so an empty canvas cannot be exported", () => {
    renderDarglarkingHub(root);

    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("rejects non-PNG files before image decoding or download link reuse", () => {
    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    downloadLink.hidden = false;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["lossy"], "artifact.jpg", { type: "image/jpeg" })],
    });

    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("reports canvas unavailability instead of wiring partially functional steganography controls", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    renderDarglarkingHub(root);

    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const pixelTrigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getElement<HTMLDivElement>(root, "#pixel-lore");

    pixelTrigger.click();

    expect(status.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status.dataset.variant).toBe("error");
    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
