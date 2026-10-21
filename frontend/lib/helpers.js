// Severity labels in order, most serious first
export const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

// Turns whatever the source gave us into one of:
// CRITICAL / HIGH / MEDIUM / LOW / OTHER (e.g. a raw CVSS vector) / NONE (not provided)
export function normalizeSeverity(value) {
  if (!value) return "NONE";

  const text = String(value).trim().toUpperCase();
  if (text === "MODERATE") return "MEDIUM";

  return SEVERITY_ORDER.includes(text) ? text : "OTHER";
}

// Lower number = more serious, used for sorting the table
export function severityRank(value) {
  const level = normalizeSeverity(value);
  const index = SEVERITY_ORDER.indexOf(level);

  if (index !== -1) return index;
  return level === "OTHER" ? SEVERITY_ORDER.length : SEVERITY_ORDER.length + 1;
}

// Only real advisory IDs get a link to osv.dev (mock IDs stay plain text)
export function osvLink(id) {
  if (!/^(GHSA|CVE|OSV|PYSEC|RUSTSEC|GO)-/i.test(id)) return null;
  return `https://osv.dev/vulnerability/${id}`;
}