import { describe, expect, it } from "vitest";
import { decodeMessageFromPixels, embedMessageInPixels } from "./steganography";

describe("LSB steganography encoder", () => {
  it("embeds and decodes a message using RGB least significant bits while preserving alpha", () => {
    const source = new Uint8ClampedArray(128).fill(170);
    for (let index = 3; index < source.length; index += 4) {
      source[index] = 41;
    }

    const encoded = embedMessageInPixels(source, "DY-044");

    expect(encoded).not.toBe(source);
    expect(source.every((value, index) => (index % 4 === 3 ? value === 41 : value === 170))).toBe(true);
    for (let index = 3; index < encoded.length; index += 4) {
      expect(encoded[index]).toBe(41);
    }
    encoded.forEach((value, index) => {
      if (index % 4 !== 3) {
        expect(Math.abs(value - source[index])).toBeLessThanOrEqual(1);
      }
    });
    expect(decodeMessageFromPixels(encoded)).toBe("DY-044");
  });

  it("throws when the secret cannot fit into the available RGB channels", () => {
    const tiny = new Uint8ClampedArray(16).fill(255);

    expect(() => embedMessageInPixels(tiny, "TOO-LARGE")).toThrow("Secret message is too large");
  });

  it("throws when an encoded payload length exceeds the available RGB channels", () => {
    const corrupted = new Uint8ClampedArray(48).fill(0);
    corrupted[41] = 1;

    expect(() => decodeMessageFromPixels(corrupted)).toThrow("Encoded payload is incomplete");
  });

  it("throws when an encoded payload uses the high bit of an overflowing length prefix", () => {
    const corrupted = new Uint8ClampedArray(48).fill(0);
    corrupted[0] = 1;

    expect(() => decodeMessageFromPixels(corrupted)).toThrow("Encoded payload is incomplete");
  });

  it("throws when an encoded payload does not contain a complete length prefix", () => {
    const corrupted = new Uint8ClampedArray(40).fill(0);

    expect(() => decodeMessageFromPixels(corrupted)).toThrow("Encoded payload is incomplete");
  });
});
