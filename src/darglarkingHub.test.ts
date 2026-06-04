/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function element<T extends Element>(root: ParentNode, selector: string) {
  const match = root.querySelector<T>(selector);

  if (!match) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return match;
}

describe("Darglarking hidden-lore hub", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "ImageData",
      class MockImageData {
        readonly colorSpace = "srgb";

        constructor(
          readonly data: Uint8ClampedArray,
          readonly width: number,
          readonly height: number,
        ) {}
      },
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:darglarking-test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => {
        callback(new Blob(["encoded"], { type: "image/png" }));
      }),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(16 * 16 * 4).fill(170),
        width: 16,
        height: 16,
      })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  it("reveals the hidden addendum and keeps aria-expanded synchronized", () => {
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const pixelTrigger = element<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = element<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("true");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("rejects lossy non-PNG uploads before attempting to encode them", () => {
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const fileInput = element<HTMLInputElement>(root, ".dy-file-input");
    const downloadLink = element<HTMLAnchorElement>(root, ".dy-download-link");
    const status = element<HTMLParagraphElement>(root, ".dy-stego-status");
    const nonPngFile = new File(["not an image"], "briefing.txt", { type: "text/plain" });

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [nonPngFile],
    });
    fileInput.dispatchEvent(new Event("change"));

    expect(downloadLink.hidden).toBe(true);
    expect(status.dataset.variant).toBe("error");
    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
  });

  it("loads a PNG, embeds the default secret, and exposes the encoded download", async () => {
    vi.stubGlobal(
      "Image",
      class MockImage {
        onload: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        readonly naturalWidth = 16;
        readonly naturalHeight = 16;

        set src(_value: string) {
          queueMicrotask(() => this.onload?.(new Event("load")));
        }
      },
    );
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const fileInput = element<HTMLInputElement>(root, ".dy-file-input");
    const encodeButton = element<HTMLButtonElement>(root, ".dy-encode-button");
    const downloadLink = element<HTMLAnchorElement>(root, ".dy-download-link");
    const status = element<HTMLParagraphElement>(root, ".dy-stego-status");
    const pngFile = new File(["png"], "yellow-room.png", { type: "image/png" });

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [pngFile],
    });
    fileInput.dispatchEvent(new Event("change"));
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(status.dataset.variant).toBe("success");
    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");

    encodeButton.click();

    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.getAttribute("download")).toBe("darglarking-yellow-encoded.png");
    expect(status.dataset.variant).toBe("success");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044: the yellow remembers"');
  });

  it("blocks embedding until a PNG has been loaded into the canvas", () => {
    const root = document.createElement("div");

    renderDarglarkingHub(root);

    const encodeButton = element<HTMLButtonElement>(root, ".dy-encode-button");
    const status = element<HTMLParagraphElement>(root, ".dy-stego-status");

    encodeButton.click();

    expect(status.dataset.variant).toBe("error");
    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
  });
});
