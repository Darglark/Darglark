const LENGTH_PREFIX_BITS = 32;
const CHANNELS_PER_PIXEL = 4;
const ALPHA_CHANNEL_OFFSET = 3;

function getWritableChannelCount(channelCount: number) {
  const fullPixelCount = Math.floor(channelCount / CHANNELS_PER_PIXEL);
  const remainingChannels = channelCount % CHANNELS_PER_PIXEL;

  return fullPixelCount * ALPHA_CHANNEL_OFFSET + Math.min(remainingChannels, ALPHA_CHANNEL_OFFSET);
}

function getWritableChannelIndex(bitIndex: number) {
  const pixelIndex = Math.floor(bitIndex / ALPHA_CHANNEL_OFFSET);
  const channelOffset = bitIndex % ALPHA_CHANNEL_OFFSET;

  return pixelIndex * CHANNELS_PER_PIXEL + channelOffset;
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

  const lengthBits = Array.from(
    { length: LENGTH_PREFIX_BITS },
    (_, bitIndex) => pixels[getWritableChannelIndex(bitIndex)] & 1,
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
