const LENGTH_PREFIX_BITS = 32;
const CHANNELS_PER_PIXEL = 4;
const WRITABLE_CHANNELS_PER_PIXEL = 3;

function getWritableChannelCount(pixelCount: number) {
  const completePixels = Math.floor(pixelCount / CHANNELS_PER_PIXEL);
  const trailingChannels = pixelCount % CHANNELS_PER_PIXEL;

  return completePixels * WRITABLE_CHANNELS_PER_PIXEL + Math.min(trailingChannels, WRITABLE_CHANNELS_PER_PIXEL);
}

function getWritableChannelIndex(payloadIndex: number) {
  const pixelOffset = Math.floor(payloadIndex / WRITABLE_CHANNELS_PER_PIXEL) * CHANNELS_PER_PIXEL;
  const channelOffset = payloadIndex % WRITABLE_CHANNELS_PER_PIXEL;

  return pixelOffset + channelOffset;
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
  const writableChannelCount = getWritableChannelCount(pixels.length);

  if (writableChannelCount < LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const lengthBits = Array.from({ length: LENGTH_PREFIX_BITS }, (_, payloadIndex) => {
    const pixelIndex = getWritableChannelIndex(payloadIndex);

    return pixels[pixelIndex] & 1;
  });
  const messageByteLength = bitsToNumber(lengthBits);
  const messageBitLength = messageByteLength * 8;

  if (messageBitLength > writableChannelCount - LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const messageBits = Array.from({ length: messageBitLength }, (_, messageBitIndex) => {
    const pixelIndex = getWritableChannelIndex(LENGTH_PREFIX_BITS + messageBitIndex);

    return pixels[pixelIndex] & 1;
  });

  return new TextDecoder().decode(bitsToBytes(messageBits));
}
