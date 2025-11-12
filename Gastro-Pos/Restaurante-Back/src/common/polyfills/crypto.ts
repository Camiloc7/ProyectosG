import * as nodeCrypto from 'crypto';

const g: any = globalThis as any;

if (!g.crypto) {
  g.crypto = nodeCrypto.webcrypto ?? {};
}

if (!g.crypto.randomUUID) {
  if (typeof nodeCrypto.randomUUID === 'function') {
    g.crypto.randomUUID = () => nodeCrypto.randomUUID();
  } else {
    g.crypto.randomUUID = () => {
      const bytes = nodeCrypto.randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      const b = Array.from(bytes, toHex).join('');
      return `${b.substring(0, 8)}-${b.substring(8, 12)}-${b.substring(12, 16)}-${b.substring(16, 20)}-${b.substring(20)}`;
    };
  }
}

if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (arr: Uint8Array) => {
    const buf = nodeCrypto.randomBytes(arr.length);
    arr.set(buf);
    return arr;
  };
}

export {};
