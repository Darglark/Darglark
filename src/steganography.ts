const LENGTH_PREFIX_BITS = 32;
const CHANNELS_PER_PIXEL = 4;
const ALPHA_CHANNEL_OFFSET = 3;
export const MAX_STEGO_IMAGE_PIXELS = 4_000_000;

export function assertStegoImageDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Selected PNG dimensions are invalid.");
  }

  if (width * height > MAX_STEGO_IMAGE_PIXELS) {
    throw new Error("Selected PNG is too large for browser-safe steganography processing.");
  }
}

function assertStegoChannelLength(channelLength: number) {
  if (channelLength > MAX_STEGO_IMAGE_PIXELS * CHANNELS_PER_PIXEL) {
    throw new Error("Selected PNG is too large for browser-safe steganography processing.");
  }
}

function getWritableChannelCount(channelLength: number) {
  const fullPixels = Math.floor(channelLength / CHANNELS_PER_PIXEL);
  const remainingChannels = channelLength % CHANNELS_PER_PIXEL;

  return fullPixels * ALPHA_CHANNEL_OFFSET + Math.min(remainingChannels, ALPHA_CHANNEL_OFFSET);
}

function getWritableChannelIndex(payloadIndex: number) {
  return Math.floor(payloadIndex / ALPHA_CHANNEL_OFFSET) * CHANNELS_PER_PIXEL + (payloadIndex % ALPHA_CHANNEL_OFFSET);
}

function numberToBits(value: number, bitCount: number) {
  return Array.from({ length: bitCount }, (_, bitIndex) => Math.floor(value / 2 ** (bitCount - bitIndex - 1)) & 1);
}

function bytesToBits(bytes: Uint8Array) {
  return Array.from(bytes).flatMap((byte) => numberToBits(byte, 8));
}

function bitsToNumber(bits: number[]) {
  return bits.reduce((value, bit) => value * 2 + bit, 0);
}

function bitsToBytes(bits: number[]) {
  if (bits.length % 8 !== 0) {
    throw new Error("Encoded payload is incomplete.");
  }

  const bytes = new Uint8Array(bits.length / 8);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = bitsToNumber(bits.slice(index * 8, index * 8 + 8));
  }

  return bytes;
}

export function embedMessageInPixels(pixels: Uint8ClampedArray, message: string) {
  assertStegoChannelLength(pixels.length);

  const messageBytes = new TextEncoder().encode(message);
  const payloadBits = [...numberToBits(messageBytes.length, LENGTH_PREFIX_BITS), ...bytesToBits(messageBytes)];
  const writableChannelCount = getWritableChannelCount(pixels.length);

  if (payloadBits.length > writableChannelCount) {
    throw new Error("Secret message is too large for the selected image.");
  }

  const encodedPixels = new Uint8ClampedArray(pixels);

  payloadBits.forEach((bit, payloadIndex) => {
    const pixelIndex = getWritableChannelIndex(payloadIndex);
    encodedPixels[pixelIndex] = (encodedPixels[pixelIndex] & 0xfe) | bit;
  });

  return encodedPixels;
}

export function decodeMessageFromPixels(pixels: Uint8ClampedArray) {
  assertStegoChannelLength(pixels.length);

  const writableChannelCount = getWritableChannelCount(pixels.length);

  if (writableChannelCount < LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const lengthBits = Array.from(
    { length: LENGTH_PREFIX_BITS },
    (_, payloadIndex) => pixels[getWritableChannelIndex(payloadIndex)] & 1,
  );
  const messageByteLength = bitsToNumber(lengthBits);
  const messageBitLength = messageByteLength * 8;

  if (messageBitLength > writableChannelCount - LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const messageBits = Array.from(
    { length: messageBitLength },
    (_, bitIndex) => pixels[getWritableChannelIndex(LENGTH_PREFIX_BITS + bitIndex)] & 1,
  );

  return new TextDecoder().decode(bitsToBytes(messageBits));
}
