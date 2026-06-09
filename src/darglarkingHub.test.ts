// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderDarglarkingHub } from "./darglarkingHub";

function getRequiredElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Expected test element to exist: ${selector}`);
  }

  return element;
}

describe("Darglarking Yellow hub", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    document.body.innerHTML = "";
  });

  it("keeps hidden lore discoverable when canvas steganography is unavailable", () => {
    const root = document.createElement("div");
    document.body.append(root);

    renderDarglarkingHub(root);

    const trigger = getRequiredElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
    const hiddenLore = getRequiredElement<HTMLDivElement>(root, "#pixel-lore");
    const status = getRequiredElement<HTMLParagraphElement>(root, ".dy-stego-status");

    expect(status.textContent).toBe("Canvas is unavailable in this browser.");
    expect(status.dataset.variant).toBe("error");
    expect(hiddenLore.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();

    expect(hiddenLore.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
