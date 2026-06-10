// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

const canvasContextStub = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
};

function renderWithCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContextStub as unknown as CanvasRenderingContext2D);

  const root = document.createElement("div");
  renderDarglarkingHub(root);

  return root;
}

describe("Darglarking hub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("reveals the hidden addendum from the calibration pixel without weakening archive link safety", () => {
    const root = renderWithCanvas();
    const pixelTrigger = root.querySelector<HTMLButtonElement>(".dy-pixel-trigger");
    const hiddenLore = root.querySelector<HTMLDivElement>("#pixel-lore");
    const archiveLink = root.querySelector<HTMLAnchorElement>(".dy-broken-link");

    expect(pixelTrigger).not.toBeNull();
    expect(hiddenLore).not.toBeNull();
    expect(archiveLink).not.toBeNull();
    expect(hiddenLore?.hidden).toBe(true);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("false");
    expect(archiveLink?.href).toContain("web.archive.org");
    expect(archiveLink?.target).toBe("_blank");
    expect(archiveLink?.rel).toBe("noreferrer");

    pixelTrigger?.click();

    expect(hiddenLore?.hidden).toBe(false);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("true");
    expect(hiddenLore?.textContent).toContain("DARG-LARK-ING / DO NOT TRUST CLEAN YELLOW");
  });

  it("reports an explicit browser capability error when canvas rendering is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const root = document.createElement("div");
    renderDarglarkingHub(root);

    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");

    expect(status?.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status?.dataset.variant).toBe("error");
  });

  it("blocks steganography encoding until a PNG has been loaded", () => {
    const root = renderWithCanvas();
    const encodeButton = root.querySelector<HTMLButtonElement>(".dy-encode-button");
    const downloadLink = root.querySelector<HTMLAnchorElement>(".dy-download-link");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");

    encodeButton?.click();

    expect(downloadLink?.hidden).toBe(true);
    expect(status?.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status?.dataset.variant).toBe("error");
  });
});
