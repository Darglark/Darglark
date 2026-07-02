// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeMessageFromPixels } from "./steganography";
import { renderDarglarkingHub } from "./darglarkingHub";

class MockImageElement extends EventTarget {
  naturalWidth = 12;
  naturalHeight = 12;
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.(new Event("load"));
    });
  }
}

function queryRequired<T extends Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files as unknown as FileList,
  });
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Darglarking hub interactions", () => {
  const originalUrlCreateObjectUrl = URL.createObjectURL;
  const originalUrlRevokeObjectUrl = URL.revokeObjectURL;
  const sourcePixels = new Uint8ClampedArray(12 * 12 * 4).fill(170);
  let root: HTMLElement;
  let encodedPixels: Uint8ClampedArray | null;
  let drawImageMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.replaceChildren(root);
    encodedPixels = null;
    drawImageMock = vi.fn();

    vi.stubGlobal("Image", MockImageElement);
    vi.stubGlobal(
      "ImageData",
      class {
        constructor(
          public data: Uint8ClampedArray,
          public width: number,
          public height: number,
        ) {}
      } as unknown as typeof ImageData,
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((value: Blob | MediaSource) => (value instanceof Blob ? "blob:encoded-output" : "blob:source-image")),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: drawImageMock,
      getImageData: vi.fn(() => new ImageData(new Uint8ClampedArray(sourcePixels), 12, 12)),
      putImageData: vi.fn((imageData: ImageData) => {
        encodedPixels = new Uint8ClampedArray(imageData.data);
      }),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback: BlobCallback, type?: string | null) => {
      callback(new Blob(["encoded"], { type: type ?? "image/png" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: originalUrlCreateObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: originalUrlRevokeObjectUrl,
    });
    document.body.replaceChildren();
  });

  it("toggles hidden pixel lore while keeping aria-expanded in sync", () => {
    renderDarglarkingHub(root);
    const trigger = queryRequired<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const lore = queryRequired<HTMLDivElement>(root, "#pixel-lore");

    expect(lore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(lore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(lore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("blocks encoding until a PNG has been loaded", () => {
    renderDarglarkingHub(root);
    const encodeButton = queryRequired<HTMLButtonElement>(root, ".dy-encode-button");
    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = queryRequired<HTMLAnchorElement>(root, ".dy-download-link");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("rejects non-PNG files before drawing or exposing a download", async () => {
    renderDarglarkingHub(root);
    const fileInput = queryRequired<HTMLInputElement>(root, ".dy-file-input");
    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = queryRequired<HTMLAnchorElement>(root, ".dy-download-link");

    setInputFiles(fileInput, [new File(["not a png"], "notes.txt", { type: "text/plain" })]);
    fileInput.dispatchEvent(new Event("change"));
    await flushMicrotasks();

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
    expect(drawImageMock).not.toHaveBeenCalled();
  });

  it("loads a PNG, embeds the default secret, verifies it, and exposes the encoded download", async () => {
    renderDarglarkingHub(root);
    const fileInput = queryRequired<HTMLInputElement>(root, ".dy-file-input");
    const encodeButton = queryRequired<HTMLButtonElement>(root, ".dy-encode-button");
    const status = queryRequired<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = queryRequired<HTMLAnchorElement>(root, ".dy-download-link");

    setInputFiles(fileInput, [new File(["png"], "yellow-room.png", { type: "image/png" })]);
    fileInput.dispatchEvent(new Event("change"));
    await flushMicrotasks();

    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status.dataset.variant).toBe("success");

    encodeButton.click();

    expect(encodedPixels).not.toBeNull();
    expect(decodeMessageFromPixels(encodedPixels ?? new Uint8ClampedArray())).toBe("DY-044: the yellow remembers");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044: the yellow remembers"');
    expect(status.dataset.variant).toBe("success");
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.href).toBe("blob:encoded-output");
  });
});
