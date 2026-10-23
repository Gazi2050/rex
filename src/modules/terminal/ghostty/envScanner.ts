/**
 * Consumes the raw PTY byte stream before the Ghostty VT and extracts the
 * env-report marker our shell integration emits (`ESC ] 6637 ; node=… ESC \`,
 * BEL also accepted as terminator). Marker bytes are stripped from the returned
 * buffer so the VT never sees an unknown OSC, and every other byte passes
 * through byte-identical, in order.
 *
 * Sequences split across PTY frames are reassembled via a carry buffer.
 * `ponytail`: markers are accepted at any time (not gated to the prompt
 * window like OSC 7) — worst case a hostile command fakes a cosmetic chip
 * value; gate the same way OSC 7 is gated if that ever matters.
 */

const ESC = 0x1b;
const BEL = 0x07;
const BACKSLASH = 0x5c;
const MARKER = new Uint8Array([0x1b, 0x5d, 0x36, 0x36, 0x33, 0x37, 0x3b]); // ESC ] 6637 ;
const MAX_SEQ = 512;

export type LeafEnvUpdate = { node?: string; branch?: string };

export type EnvScanner = {
  /** Returns the bytes to feed the VT, with env markers removed. */
  feed: (bytes: Uint8Array) => Uint8Array;
};

export function createEnvScanner(
  onEnv: (update: LeafEnvUpdate) => void,
): EnvScanner {
  let carry: Uint8Array | null = null;

  const feed = (bytes: Uint8Array): Uint8Array => {
    const buf = carry ? concat(carry, bytes) : bytes;
    carry = null;
    const out = new Uint8Array(buf.length);
    let outLen = 0;
    let i = 0;
    while (i < buf.length) {
      if (buf[i] !== ESC) {
        out[outLen++] = buf[i++];
        continue;
      }
      const room = buf.length - i;
      const full = room >= MARKER.length && matchesAt(buf, i, MARKER.length);
      if (!full) {
        // A short matching tail may be a marker split by the frame boundary;
        // hold it back instead of forwarding a torn sequence.
        if (room < MARKER.length && matchesAt(buf, i, room)) {
          carry = buf.slice(i);
          break;
        }
        out[outLen++] = buf[i++];
        continue;
      }
      const end = findTerminator(buf, i + MARKER.length);
      if (end === null) {
        if (room <= MAX_SEQ) carry = buf.slice(i);
        // Overlong unterminated run: drop it rather than print raw bytes.
        break;
      }
      const body = latin1(buf.subarray(i + MARKER.length, end.end));
      const update = parseEnvBody(body);
      if (update) onEnv(update);
      i = end.next;
    }
    return out.subarray(0, outLen);
  };

  return { feed };
}

function matchesAt(buf: Uint8Array, at: number, len: number): boolean {
  for (let k = 1; k < len; k++) {
    if (buf[at + k] !== MARKER[k]) return false;
  }
  return true;
}

function findTerminator(
  buf: Uint8Array,
  from: number,
): { end: number; next: number } | null {
  for (let j = from; j < buf.length && j - from <= MAX_SEQ; j++) {
    if (buf[j] === BEL) return { end: j, next: j + 1 };
    if (buf[j] === ESC && buf[j + 1] === BACKSLASH)
      return { end: j, next: j + 2 };
  }
  return null;
}

function latin1(bytes: Uint8Array): string {
  let s = "";
  for (let k = 0; k < bytes.length; k++) s += String.fromCharCode(bytes[k]);
  return s;
}

export function parseEnvBody(body: string): LeafEnvUpdate | null {
  const eq = body.indexOf("=");
  if (eq <= 0) return null;
  const key = body.slice(0, eq);
  const raw = body.slice(eq + 1);
  if (!raw) return null;
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (key === "node") return { node: value };
  if (key === "branch") return { branch: value };
  return null;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
