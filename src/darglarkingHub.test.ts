// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function renderHub() {
  const root = document.createElement("div");
  document.body.append(root);

  renderDarglarkingHub(root);

  return root;
}

function getElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Expected test element: ${selector}`);
  }

  return element;
}

describe("Darglarking Yellow hub", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("reveals and hides the pixel addendum with matching expanded state", () => {
    const root = renderHub();
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

  it("rejects non-PNG assets before image loading or encoding can start", () => {
    const root = renderHub();
    const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [new File(["not-a-png"], "yellow-room.jpg", { type: "image/jpeg" })],
    });

    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe("Select a PNG asset so the encoded output remains lossless.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });

  it("blocks embedding until a valid PNG has been loaded into the canvas", () => {
    const root = renderHub();
    const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
    const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
    const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");

    encodeButton.click();

    expect(status.textContent).toBe("Upload a PNG before embedding a code.");
    expect(status.dataset.variant).toBe("error");
    expect(downloadLink.hidden).toBe(true);
  });
});
