/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function createRoot() {
  const root = document.createElement("div");
  document.body.append(root);
  return root;
}

function stubCanvasContext(context: Partial<CanvasRenderingContext2D> | null = {}) {
  return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as CanvasRenderingContext2D);
}

function getElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }

  return element;
}

describe("Darglarking hub interactions", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("reveals and hides the pixel addendum while keeping aria-expanded synchronized", () => {
    stubCanvasContext();
    const root = createRoot();

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

  it("surfaces a safe error when the browser cannot provide a canvas context", () => {
    stubCanvasContext(null);
    const root = createRoot();

    renderDarglarkingHub(root);

    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");

    expect(status.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status.dataset.variant).toBe("error");
  });

  it("keeps encoding locked until a valid PNG asset has loaded", () => {
    stubCanvasContext();
    const root = createRoot();

    renderDarglarkingHub(root);

    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("rejects non-PNG uploads without unlocking the download link", () => {
    stubCanvasContext();
    const root = createRoot();

    renderDarglarkingHub(root);

    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
    const invalidFile = new File(["not an image"], "case-file.jpg", { type: "image/jpeg" });

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [invalidFile],
    });
    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });
});
