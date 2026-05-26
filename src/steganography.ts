const LENGTH_PREFIX_BITS = 32;
const CHANNELS_PER_PIXEL = 4;
const ALPHA_CHANNEL_OFFSET = 3;

function getWritableChannelIndexes(pixelCount: number) {
  const indexes: number[] = [];

  for (let index = 0; index < pixelCount; index += 1) {
    if (index % CHANNELS_PER_PIXEL !== ALPHA_CHANNEL_OFFSET) {
      indexes.push(index);
    }
  }

  return indexes;
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
  const writableIndexes = getWritableChannelIndexes(pixels.length);

  if (payloadBits.length > writableIndexes.length) {
    throw new Error("Secret message is too large for the selected image.");
  }

  const encodedPixels = new Uint8ClampedArray(pixels);

  payloadBits.forEach((bit, payloadIndex) => {
    const pixelIndex = writableIndexes[payloadIndex];
    encodedPixels[pixelIndex] = (encodedPixels[pixelIndex] & 0xfe) | bit;
  });

  return encodedPixels;
}

export function decodeMessageFromPixels(pixels: Uint8ClampedArray) {
  const writableIndexes = getWritableChannelIndexes(pixels.length);

  if (writableIndexes.length < LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const lengthBits = writableIndexes.slice(0, LENGTH_PREFIX_BITS).map((pixelIndex) => pixels[pixelIndex] & 1);
  const messageByteLength = bitsToNumber(lengthBits);
  const messageBitLength = messageByteLength * 8;

  if (messageBitLength > writableIndexes.length - LENGTH_PREFIX_BITS) {
    throw new Error("Encoded payload is incomplete.");
  }

  const messageBits = writableIndexes
    .slice(LENGTH_PREFIX_BITS, LENGTH_PREFIX_BITS + messageBitLength)
    .map((pixelIndex) => pixels[pixelIndex] & 1);

  return new TextDecoder().decode(bitsToBytes(messageBits));
}
