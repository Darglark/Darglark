// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

class MockImageData implements ImageData {
  readonly colorSpace: PredefinedColorSpace = "srgb";
  readonly data: ImageDataArray;
  readonly width: number;
  readonly height: number;

  constructor(data: ImageDataArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

class MockImage {
  naturalWidth = 24;
  naturalHeight = 24;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const prototypeDescriptors = new Map<PropertyKey, PropertyDescriptor | undefined>();
const globalDescriptors = new Map<PropertyKey, PropertyDescriptor | undefined>();

function rememberPrototypeDescriptor(key: keyof HTMLCanvasElement) {
  if (!prototypeDescriptors.has(key)) {
    prototypeDescriptors.set(key, Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, key));
  }
}

function rememberGlobalDescriptor(key: keyof typeof globalThis) {
  if (!globalDescriptors.has(key)) {
    globalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
}

function restoreDescriptor(target: object, key: PropertyKey, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }

  Reflect.deleteProperty(target, key);
}

function flushAsyncWork() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function getElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}

describe("Darglarking hub", () => {
  let root: HTMLDivElement;
  let getImageData: ReturnType<typeof vi.fn<() => ImageData>>;
  let putImageData: ReturnType<typeof vi.fn<(imageData: ImageData, dx: number, dy: number) => void>>;

  beforeEach(() => {
    root = document.createElement("div");
    getImageData = vi.fn(() => new ImageData(new Uint8ClampedArray(24 * 24 * 4).fill(170), 24, 24));
    putImageData = vi.fn();

    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData,
      putImageData,
    } as unknown as CanvasRenderingContext2D;

    rememberPrototypeDescriptor("getContext");
    rememberPrototypeDescriptor("toBlob");
    rememberGlobalDescriptor("Image");
    rememberGlobalDescriptor("ImageData");

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => context),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => {
        callback(new Blob(["encoded"], { type: "image/png" }));
      }),
    });
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: MockImage,
    });
    Object.defineProperty(globalThis, "ImageData", {
      configurable: true,
      value: MockImageData,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:mock-url"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, descriptor] of prototypeDescriptors) {
      restoreDescriptor(HTMLCanvasElement.prototype, key, descriptor);
    }
    for (const [key, descriptor] of globalDescriptors) {
      restoreDescriptor(globalThis, key, descriptor);
    }
    prototypeDescriptors.clear();
    globalDescriptors.clear();
  });

  it("reveals and hides Addendum 044-B from the calibration pixel", () => {
    renderDarglarkingHub(root);

    const trigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const lore = getElement<HTMLDivElement>(root, "#pixel-lore");

    expect(lore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(lore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(lore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("rejects non-PNG uploads before any image decoding or canvas mutation", async () => {
    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["not png"], "case-044.jpg", { type: "image/jpeg" })],
    });

    fileInput.dispatchEvent(new Event("change"));
    await flushAsyncWork();

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
    expect(getImageData).not.toHaveBeenCalled();
  });

  it("loads a PNG, embeds the secret, verifies the decoded message, and exposes a download", async () => {
    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const secretInput = getElement<HTMLInputElement>(root, ".dy-secret-input");
    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");

    secretInput.value = "DY-044";
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["png"], "yellow-room.png", { type: "image/png" })],
    });

    fileInput.dispatchEvent(new Event("change"));
    await flushAsyncWork();

    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status.dataset.variant).toBe("success");

    encodeButton.click();
    await flushAsyncWork();

    expect(getImageData).toHaveBeenCalledWith(0, 0, 24, 24);
    expect(putImageData).toHaveBeenCalledOnce();
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.href).toBe("blob:mock-url");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044"');
    expect(status.dataset.variant).toBe("success");
  });
});
