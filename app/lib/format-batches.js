export function formatBatchRanges(batches = []) {
  if (!Array.isArray(batches) || batches.length === 0) return "";

  const seen = new Set();
  const byPrefix = new Map();
  const other = [];

  for (const raw of batches) {
    const token = String(raw ?? "").trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);

    const m = token.match(/^([A-Za-z]+)(\d+)$/);
    if (!m) {
      other.push(token);
      continue;
    }

    const prefix = m[1].toUpperCase();
    const num = parseInt(m[2], 10);
    if (!Number.isFinite(num)) {
      other.push(token);
      continue;
    }

    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set());
    byPrefix.get(prefix).add(num);
  }

  const parts = [];

  const prefixes = Array.from(byPrefix.keys()).sort((a, b) => a.localeCompare(b));
  for (const prefix of prefixes) {
    const nums = Array.from(byPrefix.get(prefix)).sort((a, b) => a - b);
    let start = null;
    let prev = null;

    for (const n of nums) {
      if (start == null) {
        start = n;
        prev = n;
        continue;
      }
      if (n === prev + 1) {
        prev = n;
        continue;
      }
      parts.push(start === prev ? `${prefix}${start}` : `${prefix}${start}-${prev}`);
      start = n;
      prev = n;
    }
    if (start != null) {
      parts.push(start === prev ? `${prefix}${start}` : `${prefix}${start}-${prev}`);
    }
  }

  if (other.length) {
    other.sort((a, b) => a.localeCompare(b));
    parts.push(...other);
  }

  return parts.join(", ");
}
