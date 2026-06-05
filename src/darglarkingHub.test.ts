// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

const makeCanvasPixels = () => new Uint8ClampedArray(10 * 10 * 4).fill(170);

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

class TestImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 10;
  naturalHeight = 10;
  #src = "";

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => this.onload?.());
  }

  get src() {
    return this.#src;
  }
}

const waitForQueuedImageLoad = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Darglarking Yellow browser hub", () => {
  let root: HTMLDivElement;
  let pixels: Uint8ClampedArray;
  let objectUrlIndex: number;
  let revokedObjectUrls: string[];

  beforeEach(() => {
    root = document.createElement("div");
    pixels = makeCanvasPixels();
    objectUrlIndex = 0;
    revokedObjectUrls = [];

    vi.stubGlobal("Image", TestImage);
    vi.stubGlobal("ImageData", TestImageData);
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      objectUrlIndex += 1;
      return `blob:test-${objectUrlIndex}`;
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation((objectUrl) => {
      revokedObjectUrls.push(objectUrl);
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => new ImageData(pixels as unknown as ImageDataArray, 10, 10)),
      putImageData: vi.fn((imageData: ImageData) => {
        pixels = new Uint8ClampedArray(imageData.data);
      }),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["encoded"], { type: "image/png" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reveals and hides the pixel transcript with matching aria state", () => {
    renderDarglarkingHub(root);

    const pixelTrigger = root.querySelector<HTMLButtonElement>(".dy-pixel-trigger");
    const hiddenLore = root.querySelector<HTMLDivElement>("#pixel-lore");

    expect(pixelTrigger).not.toBeNull();
    expect(hiddenLore).not.toBeNull();
    expect(hiddenLore?.hidden).toBe(true);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("false");

    pixelTrigger?.click();

    expect(hiddenLore?.hidden).toBe(false);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("true");

    pixelTrigger?.click();

    expect(hiddenLore?.hidden).toBe(true);
    expect(pixelTrigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps steganography output locked until a PNG asset is loaded", async () => {
    renderDarglarkingHub(root);

    const encodeButton = root.querySelector<HTMLButtonElement>(".dy-encode-button");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");
    const downloadLink = root.querySelector<HTMLAnchorElement>(".dy-download-link");

    encodeButton?.click();

    expect(status?.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status?.dataset.variant).toBe("error");
    expect(downloadLink?.hidden).toBe(true);
  });

  it("rejects non-PNG files and clears stale encoded downloads", async () => {
    renderDarglarkingHub(root);

    const fileInput = root.querySelector<HTMLInputElement>(".dy-file-input");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");
    const downloadLink = root.querySelector<HTMLAnchorElement>(".dy-download-link");
    const jpeg = new File(["lossy"], "yellow-room.jpg", { type: "image/jpeg" });

    expect(fileInput).not.toBeNull();
    expect(downloadLink).not.toBeNull();

    downloadLink!.hidden = false;
    Object.defineProperty(fileInput, "files", { value: [jpeg], configurable: true });

    fileInput?.dispatchEvent(new Event("change"));

    expect(downloadLink?.hidden).toBe(true);
    expect(status?.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status?.dataset.variant).toBe("error");
  });

  it("loads a PNG, embeds the secret through canvas pixels, and exposes a verified download", async () => {
    renderDarglarkingHub(root);

    const fileInput = root.querySelector<HTMLInputElement>(".dy-file-input");
    const secretInput = root.querySelector<HTMLInputElement>(".dy-secret-input");
    const encodeButton = root.querySelector<HTMLButtonElement>(".dy-encode-button");
    const status = root.querySelector<HTMLParagraphElement>(".dy-stego-status");
    const downloadLink = root.querySelector<HTMLAnchorElement>(".dy-download-link");
    const png = new File(["png"], "yellow-room.png", { type: "image/png" });

    expect(fileInput).not.toBeNull();
    expect(secretInput).not.toBeNull();
    expect(encodeButton).not.toBeNull();
    expect(downloadLink).not.toBeNull();

    secretInput!.value = "DY-044";
    Object.defineProperty(fileInput, "files", { value: [png], configurable: true });

    fileInput?.dispatchEvent(new Event("change"));
    await waitForQueuedImageLoad();

    expect(status?.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status?.dataset.variant).toBe("success");
    expect(revokedObjectUrls).toEqual(["blob:test-1"]);

    encodeButton?.click();

    expect(downloadLink?.hidden).toBe(false);
    expect(downloadLink?.href).toBe("blob:test-2");
    expect(status?.textContent).toBe('Embedded and verified secret: "DY-044"');
    expect(status?.dataset.variant).toBe("success");
  });
});
