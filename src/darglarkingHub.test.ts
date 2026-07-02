import { describe, expect, it } from "vitest";
import {
  getPngDimensions,
  MAX_STEGO_IMAGE_DIMENSION,
  MAX_STEGO_IMAGE_PIXELS,
  validatePngDimensions,
} from "./darglarkingHub";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function createPngHeader(width: number, height: number) {
  const header = new Uint8Array(24);
  header.set(PNG_SIGNATURE, 0);
  header[12] = "I".charCodeAt(0);
  header[13] = "H".charCodeAt(0);
  header[14] = "D".charCodeAt(0);
  header[15] = "R".charCodeAt(0);

  const view = new DataView(header.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);

  return header;
}

describe("Darglarking hub PNG upload guard", () => {
  it("reads PNG dimensions from the IHDR header before image decoding", () => {
    expect(getPngDimensions(createPngHeader(640, 480))).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("rejects files without a valid PNG signature and IHDR header", () => {
    const header = createPngHeader(640, 480);
    header[1] = 0;

    expect(() => getPngDimensions(header)).toThrow("not a valid PNG");
  });

  it("accepts PNG dimensions within the browser-safe canvas budget", () => {
    expect(() =>
      validatePngDimensions({
        width: Math.sqrt(MAX_STEGO_IMAGE_PIXELS),
        height: Math.sqrt(MAX_STEGO_IMAGE_PIXELS),
      }),
    ).not.toThrow();
  });

  it("rejects PNG dimensions that would allocate an oversized canvas buffer", () => {
    expect(() =>
      validatePngDimensions({
        width: MAX_STEGO_IMAGE_DIMENSION + 1,
        height: 1,
      }),
    ).toThrow("too large");

    expect(() =>
      validatePngDimensions({
        width: MAX_STEGO_IMAGE_DIMENSION,
        height: Math.floor(MAX_STEGO_IMAGE_PIXELS / MAX_STEGO_IMAGE_DIMENSION) + 1,
      }),
    ).toThrow("too large");
  });
});
