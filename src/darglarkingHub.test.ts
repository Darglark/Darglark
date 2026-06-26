import { describe, expect, it } from "vitest";
import { encodeDarglarkingSecret } from "./darglarkingHub";
import { decodeMessageFromPixels } from "./steganography";

describe("Darglarking hub steganography flow", () => {
  it("embeds and verifies the default hub secret before offering a PNG download", () => {
    const source = new Uint8ClampedArray(400).fill(170);

    const result = encodeDarglarkingSecret(source, "DY-044: the yellow remembers");

    expect(result.decodedCheck).toBe("DY-044: the yellow remembers");
    expect(decodeMessageFromPixels(result.encodedPixels)).toBe("DY-044: the yellow remembers");
    expect(result.encodedPixels).not.toBe(source);
    expect(source.every((value) => value === 170)).toBe(true);
  });

  it("surfaces steganography capacity failures from the hub encode path", () => {
    const tiny = new Uint8ClampedArray(16).fill(255);

    expect(() => encodeDarglarkingSecret(tiny, "DY-044")).toThrow("Secret message is too large");
  });
});
