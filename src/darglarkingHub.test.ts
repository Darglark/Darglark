// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";
import { decodeMessageFromPixels } from "./steganography";

class TestImageData implements ImageData {
  readonly colorSpace: PredefinedColorSpace = "srgb";

  constructor(
    readonly data: ImageDataArray,
    readonly width: number,
    readonly height: number,
  ) {}
}

class TestImage {
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  naturalHeight = 8;
  naturalWidth = 16;
  private imageSrc = "";

  get src() {
    return this.imageSrc;
  }

  set src(value: string) {
    this.imageSrc = value;
    queueMicrotask(() => this.onload?.());
  }
}

type TestCanvasContext = Pick<
  CanvasRenderingContext2D,
  "clearRect" | "drawImage" | "getImageData" | "putImageData"
>;

function getElement<T extends Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}

function createCanvasContext(canvas: HTMLCanvasElement) {
  let currentImageData: ImageData = new TestImageData(createPixelData(canvas.width * canvas.height * 4), canvas.width, canvas.height);

  const context: TestCanvasContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => {
      currentImageData = new TestImageData(createPixelData(canvas.width * canvas.height * 4), canvas.width, canvas.height);
      return currentImageData;
    }),
    putImageData: vi.fn((imageData: ImageData) => {
      currentImageData = imageData;
    }),
  };

  return {
    context,
    get currentImageData() {
      return currentImageData;
    },
  };
}

function createPixelData(length: number): ImageDataArray {
  const data = new Uint8ClampedArray(new ArrayBuffer(length));
  data.fill(170);
  return data;
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files as unknown as FileList,
  });
}

function flushMicrotasks() {
  return new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
}

describe("Darglarking Yellow hub", () => {
  let root: HTMLDivElement;
  let latestCanvasContext: ReturnType<typeof createCanvasContext> | null;
  let createObjectUrl: ReturnType<typeof vi.fn<(file: Blob | MediaSource) => string>>;
  let revokeObjectUrl: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.replaceChildren(root);
    latestCanvasContext = null;
    createObjectUrl = vi.fn<(file: Blob | MediaSource) => string>((file) =>
      file instanceof File ? "blob:source-png" : "blob:encoded-png",
    );
    revokeObjectUrl = vi.fn<(url: string) => void>();

    vi.stubGlobal("Image", TestImage);
    vi.stubGlobal("ImageData", TestImageData);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function getContext() {
      latestCanvasContext = createCanvasContext(this);
      return latestCanvasContext.context as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function toBlob(
      this: HTMLCanvasElement,
      callback: BlobCallback,
    ) {
      callback(new Blob(["encoded"], { type: "image/png" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("reveals and hides the pixel lore while keeping aria-expanded in sync", () => {
    renderDarglarkingHub(root);

    const trigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getElement<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("refuses to encode until a PNG has been loaded", () => {
    renderDarglarkingHub(root);

    getElement<HTMLButtonElement>(root, ".dy-encode-button").click();

    expect(getElement<HTMLParagraphElement>(root, ".dy-stego-status").textContent).toBe("Upload a PNG before embedding a code.");
    expect(getElement<HTMLParagraphElement>(root, ".dy-stego-status").dataset.variant).toBe("error");
    expect(getElement<HTMLAnchorElement>(root, ".dy-download-link").hidden).toBe(true);
    expect(latestCanvasContext?.context.getImageData).not.toHaveBeenCalled();
  });

  it("rejects lossy or unsupported source files before image loading", async () => {
    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    setInputFiles(fileInput, [new File(["not an image"], "notes.txt", { type: "text/plain" })]);
    fileInput.dispatchEvent(new Event("change"));
    await flushMicrotasks();

    expect(getElement<HTMLParagraphElement>(root, ".dy-stego-status").textContent).toBe(
      "Select a PNG asset so the encoded output remains lossless.",
    );
    expect(getElement<HTMLParagraphElement>(root, ".dy-stego-status").dataset.variant).toBe("error");
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(getElement<HTMLAnchorElement>(root, ".dy-download-link").hidden).toBe(true);
  });

  it("loads a PNG, embeds the secret, verifies the payload, and exposes a download URL", async () => {
    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const secretInput = getElement<HTMLInputElement>(root, ".dy-secret-input");
    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    secretInput.value = "DY-044 regression";
    setInputFiles(fileInput, [new File(["png"], "yellow-room.png", { type: "image/png" })]);
    fileInput.dispatchEvent(new Event("change"));
    await flushMicrotasks();

    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status.dataset.variant).toBe("success");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:source-png");

    encodeButton.click();

    expect(latestCanvasContext?.context.putImageData).toHaveBeenCalledTimes(1);
    expect(decodeMessageFromPixels(latestCanvasContext?.currentImageData.data ?? createPixelData(0))).toBe("DY-044 regression");
    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.href).toBe("blob:encoded-png");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044 regression"');
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
  });
});
