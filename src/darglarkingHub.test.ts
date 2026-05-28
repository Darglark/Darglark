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
    vi.unstubAllGlobals();
  });

  it("keeps the hidden addendum disclosure state and aria-expanded value in sync", () => {
    renderDarglarkingHub(root);

    const pixelTrigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getElement<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("true");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");
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

  it("loads, encodes, verifies, and exposes a PNG download link", async () => {
    const createObjectURL = vi.fn().mockReturnValueOnce("blob:source-png").mockReturnValueOnce("blob:encoded-png");
    const revokeObjectURL = vi.fn();
    const putImageData = vi.fn();

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 10;
        naturalHeight = 10;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["encoded"], { type: "image/png" }));
    });
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(400).fill(170),
        width: 10,
        height: 10,
      })),
      putImageData,
    } as unknown as CanvasRenderingContext2D);

    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["png"], "yellow-room.png", { type: "image/png" })],
    });

    fileInput.dispatchEvent(new Event("change"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    encodeButton.click();

    expect(status.textContent).toBe('Embedded and verified secret: "DY-044: the yellow remembers"');
    expect(status.dataset.variant).toBe("success");
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.getAttribute("href")).toBe("blob:encoded-png");
    expect(putImageData).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:source-png");
  });

  it("reports canvas unavailability in the steganography status", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    renderDarglarkingHub(root);

    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    expect(status.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status.dataset.variant).toBe("error");
  });
});
