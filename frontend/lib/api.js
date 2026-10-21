import { mockRawScan } from "./mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 180000;

export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch { return false; }
}

export async function runScan({ useMock = false, files = [] } = {}) {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ...normalizeScan(mockRawScan), isMock: true };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const form = new FormData();
    if (files.length) {
      files.forEach((file) => {
        // webkitRelativePath preserves directory structure for folder uploads.
        form.append("files", file, file.webkitRelativePath || file.name);
      });
    } else {
      form.append("target", "sample-project");
    }
    const res = await fetch(`${API_URL}/api/scan`, { method: "POST", body: form, signal: controller.signal });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const data = await res.json();
    return { ...normalizeScan(data), isMock: false };
  } catch (err) {
    if (err.name === "AbortError") throw new Error("The scan exceeded 3 minutes and was stopped.");
    if (err instanceof TypeError) throw new Error(`Could not reach backend at ${API_URL}. Check that the backend is running and CORS allows this frontend.`);
    throw err;
  } finally { clearTimeout(timer); }
}

async function readErrorMessage(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  } catch {}
  return `Backend error (HTTP ${res.status}).`;
}

function normalizeScan(raw) {
  const findings = (raw.findings || []).map((item, index) => {
    const references = (item.references || []).map((ref) => typeof ref === "string" ? ref : ref?.url).filter((url) => typeof url === "string" && /^https?:\/\//i.test(url));
    const reach = String(item.reachability_status || "UNKNOWN").toUpperCase();
    const status = ["REACHABLE", "UNREACHABLE", "UNKNOWN"].includes(reach) ? reach : "UNKNOWN";
    return {
      id: `${index}-${item.package || "unknown"}-${item.vulnerability_id || "unknown"}`,
      package: String(item.package ?? "unknown"),
      version: String(item.version ?? "-"),
      vulnerabilityId: String(item.vulnerability_id ?? item.cve ?? "unknown"),
      summary: String(item.summary || "No advisory summary supplied."),
      severity: String(item.severity || "UNKNOWN").toUpperCase(),
      references,
      reachabilityStatus: status,
      reachabilityBasis: String(item.reachability_basis || "Backend did not provide the evidence used for this classification."),
      priority: String(item.priority || "Needs triage"),
      filePath: String(item.file_path || item.vulnerable_file || "Not established"),
      functionName: String(item.function_name || item.vulnerable_function || "Not established"),
      lineStart: item.line_start ?? null,
      lineEnd: item.line_end ?? null,
      vulnerableSymbol: String(item.vulnerable_symbol || "Not established"),
      dependencyUsage: String(item.dependency_usage || "Not established"),
      dependencyPath: Array.isArray(item.dependency_path) ? item.dependency_path.map(String) : [],
      evidenceType: String(item.evidence_type || "Not provided"),
      evidenceComplete: item.evidence_complete === true,
      cvss: item.cvss ?? null,
      epss: item.epss ?? null,
      kev: item.kev ?? null
    };
  });
  return {
    scanId: raw.scan_id ?? null, status: raw.status ?? "completed",
    target: raw.target ?? "uploaded project", scannedAt: raw.scanned_at || new Date().toISOString(),
    componentCount: Number(raw.component_count ?? raw.components_count ?? 0),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [], findings
  };
}
