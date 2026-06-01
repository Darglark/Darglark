/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function getRequiredElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing expected test element: ${selector}`);
  }

  return element;
}

function renderHub() {
  const root = document.createElement("div");

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () =>
      ({
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
      }) as unknown as CanvasRenderingContext2D,
  );

  renderDarglarkingHub(root);

  return root;
}

describe("Darglarking Yellow hub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reveals and hides the calibration-pixel addendum with accessible expanded state", () => {
    const root = renderHub();
    const trigger = getRequiredElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getRequiredElement<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("rejects non-PNG uploads before attempting image decoding or download creation", () => {
    const root = renderHub();
    const fileInput = getRequiredElement<HTMLInputElement>(root, ".dy-file-input");
    const status = getRequiredElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getRequiredElement<HTMLAnchorElement>(root, ".dy-download-link");

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["not a png"], "yellow-room.txt", { type: "text/plain" })],
    });

    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("blocks LSB encoding until a PNG has been loaded into the canvas", () => {
    const root = renderHub();
    const encodeButton = getRequiredElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getRequiredElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getRequiredElement<HTMLAnchorElement>(root, ".dy-download-link");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("reports canvas unavailability instead of wiring incomplete steganography controls", () => {
    const root = document.createElement("div");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);

    renderDarglarkingHub(root);

    const status = getRequiredElement<HTMLParagraphElement>(root, ".dy-stego-status");
    expect(status.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status.dataset.variant).toBe("error");
  });
});
