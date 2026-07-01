// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeMessageFromPixels } from "./steganography";
import { renderDarglarkingHub } from "./darglarkingHub";

const CANVAS_WIDTH = 16;
const CANVAS_HEIGHT = 16;

function queryRequired<T extends Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Expected test element to exist: ${selector}`);
  }

  return element;
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    value: files,
    configurable: true,
  });
}

function makeCanvasPixels() {
  const pixels = new Uint8ClampedArray(CANVAS_WIDTH * CANVAS_HEIGHT * 4).fill(170);

  for (let index = 3; index < pixels.length; index += 4) {
    pixels[index] = 255;
  }

  return pixels;
}

async function waitForAsyncHandlers() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("Darglarking Yellow hub interactions", () => {
  let root: HTMLDivElement;
  let sourcePixels: Uint8ClampedArray;
  let encodedPixels: Uint8ClampedArray | null;

  beforeEach(() => {
    root = document.createElement("div");
    sourcePixels = makeCanvasPixels();
    encodedPixels = null;

    vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:dy-test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    vi.stubGlobal(
      "Image",
      class MockImage {
        naturalWidth = CANVAS_WIDTH;
        naturalHeight = CANVAS_HEIGHT;
        onload: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null;
        onerror: OnErrorEventHandler = null;

        set src(_value: string) {
          queueMicrotask(() => {
            this.onload?.call(this as unknown as GlobalEventHandlers, new Event("load"));
          });
        }
      },
    );

    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(sourcePixels),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        colorSpace: "srgb" as PredefinedColorSpace,
      })),
      putImageData: vi.fn((imageData: ImageData) => {
        encodedPixels = new Uint8ClampedArray(imageData.data);
      }),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["encoded"], { type: "image/png" }));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reveals and hides the pixel lore while keeping aria-expanded in sync", () => {
    renderDarglarkingHub(root);

    const trigger = queryRequired<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = queryRequired<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("blocks encoding until a PNG has been loaded", () => {
    renderDarglarkingHub(root);

    queryRequired<HTMLButtonElement>(root, ".dy-encode-button").click();

    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = queryRequired<HTMLAnchorElement>(root, ".dy-download-link");

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
    expect(encodedPixels).toBeNull();
  });

  it("rejects non-PNG uploads before attempting image decoding", () => {
    renderDarglarkingHub(root);

    const fileInput = queryRequired<HTMLInputElement>(root, ".dy-file-input");
    setInputFiles(fileInput, [new File(["not a png"], "yellow-room.txt", { type: "text/plain" })]);
    fileInput.dispatchEvent(new Event("change"));

    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("loads a PNG, embeds the current secret into canvas pixels, and exposes a download", async () => {
    renderDarglarkingHub(root);

    const fileInput = queryRequired<HTMLInputElement>(root, ".dy-file-input");
    const secretInput = queryRequired<HTMLInputElement>(root, ".dy-secret-input");
    const encodeButton = queryRequired<HTMLButtonElement>(root, ".dy-encode-button");
    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = queryRequired<HTMLAnchorElement>(root, ".dy-download-link");

    secretInput.value = "DY-044 regression sentinel";
    setInputFiles(fileInput, [new File(["png bytes"], "yellow-room.png", { type: "image/png" })]);
    fileInput.dispatchEvent(new Event("change"));
    await waitForAsyncHandlers();

    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status.dataset.variant).toBe("success");

    encodeButton.click();
    await waitForAsyncHandlers();

    const capturedPixels = encodedPixels;
    expect(capturedPixels).not.toBeNull();
    if (!capturedPixels) {
      throw new Error("Expected the hub to write encoded pixels back to the canvas.");
    }

    expect(decodeMessageFromPixels(capturedPixels)).toBe("DY-044 regression sentinel");
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.href).toBe("blob:dy-test");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044 regression sentinel"');
    expect(status.dataset.variant).toBe("success");

    for (let index = 3; index < capturedPixels.length; index += 4) {
      expect(capturedPixels[index]).toBe(255);
    }
  });
});
