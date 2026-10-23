/**
 * Word extraction for terminal click-to-open: finds the whitespace-delimited
 * token around a cell column in a terminal line and cleans the punctuation
 * that programs commonly wrap paths in (quotes, brackets, list commas).
 */

const EDGE_CHARS = new Set([
  '"',
  "'",
  "`",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "<",
  ">",
  ",",
  ":",
  ";",
  "*",
  "|",
]);

export function wordRangeAt(
  line: string,
  index: number,
): { start: number; end: number } | null {
  if (index < 0 || index >= line.length) return null;
  if (/\s/.test(line[index])) return null;
  let start = index;
  while (start > 0 && !/\s/.test(line[start - 1])) start--;
  let end = index + 1;
  while (end < line.length && !/\s/.test(line[end])) end++;
  return { start, end };
}

export function cleanPathToken(token: string): string {
  let start = 0;
  let end = token.length;
  while (start < end && EDGE_CHARS.has(token[start])) start++;
  while (end > start && EDGE_CHARS.has(token[end - 1])) end--;
  const trimmed = token.slice(start, end).replace(/["':;,]+$/g, "");
  // Pure punctuation (`--`, `..`) is a flag or noise, never a path.
  return trimmed.length >= 2 && /[\w]/.test(trimmed) ? trimmed : "";
}
