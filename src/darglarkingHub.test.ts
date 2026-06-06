// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

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

const makeCanvasPixels = () => new Uint8ClampedArray(10 * 10 * 4).fill(170);
const waitForImageLoad = () => new Promise((resolve) => setTimeout(resolve, 0));

function getHubElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);
  expect(element).not.toBeNull();
  return element as T;
}

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
      getImageData: vi.fn(() => new ImageData(pixels, 10, 10)),
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

    const pixelTrigger = getHubElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getHubElement<HTMLDivElement>(root, "#pixel-lore");

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("true");

    pixelTrigger.click();

    expect(hiddenLore.hidden).toBe(true);
    expect(pixelTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps steganography output locked until a PNG asset is loaded", () => {
    renderDarglarkingHub(root);

    const encodeButton = getHubElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getHubElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getHubElement<HTMLAnchorElement>(root, ".dy-download-link");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("rejects non-PNG files and clears stale encoded downloads", () => {
    renderDarglarkingHub(root);

    const fileInput = getHubElement<HTMLInputElement>(root, ".dy-file-input");
    const status = getHubElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getHubElement<HTMLAnchorElement>(root, ".dy-download-link");
    const jpeg = new File(["lossy"], "yellow-room.jpg", { type: "image/jpeg" });

    downloadLink.hidden = false;
    Object.defineProperty(fileInput, "files", { value: [jpeg], configurable: true });

    fileInput.dispatchEvent(new Event("change"));

    expect(downloadLink.hidden).toBe(true);
    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
  });

  it("loads a PNG, embeds the secret through canvas pixels, and exposes a verified download", async () => {
    renderDarglarkingHub(root);

    const fileInput = getHubElement<HTMLInputElement>(root, ".dy-file-input");
    const secretInput = getHubElement<HTMLInputElement>(root, ".dy-secret-input");
    const encodeButton = getHubElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getHubElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getHubElement<HTMLAnchorElement>(root, ".dy-download-link");
    const png = new File(["png"], "yellow-room.png", { type: "image/png" });

    secretInput.value = "DY-044";
    Object.defineProperty(fileInput, "files", { value: [png], configurable: true });

    fileInput.dispatchEvent(new Event("change"));
    await waitForImageLoad();

    expect(status.textContent).toBe("Loaded yellow-room.png. Ready to alter the least significant RGB bits.");
    expect(status.dataset.variant).toBe("success");
    expect(revokedObjectUrls).toEqual(["blob:test-1"]);

    encodeButton.click();

    expect(downloadLink.hidden).toBe(false);
    expect(downloadLink.href).toBe("blob:test-2");
    expect(status.textContent).toBe('Embedded and verified secret: "DY-044"');
    expect(status.dataset.variant).toBe("success");
  });
});
