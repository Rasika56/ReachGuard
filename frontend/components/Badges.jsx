import { normalizeSeverity } from "@/lib/helpers";

const BASE =
  "inline-block max-w-40 truncate rounded-full px-2.5 py-0.5 align-middle text-xs font-semibold ring-1 ring-inset";

const SEVERITY_STYLES = {
  CRITICAL:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/30",
  MEDIUM:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
  LOW: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30",
  OTHER:
    "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-400/30",
  NONE: "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-400 dark:ring-slate-400/30",
};

const REACHABILITY_STYLES = {
  UNKNOWN:
    "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-400/30",
  SIMULATED:
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30",
};

export function SeverityBadge({ value }) {
  const level = normalizeSeverity(value);

  let label;
  if (level === "NONE") {
    label = "Not provided";
  } else if (level === "OTHER") {
    label = String(value); // e.g. a raw CVSS vector from the source
  } else {
    label = level.charAt(0) + level.slice(1).toLowerCase();
  }

  return (
    <span
      title={value ? String(value) : "The source did not provide a severity"}
      className={`${BASE} ${SEVERITY_STYLES[level]}`}
    >
      {label}
    </span>
  );
}

export function ReachabilityBadge({ status }) {
  const label = String(status || "UNKNOWN").toUpperCase();
  const style = REACHABILITY_STYLES[label] || REACHABILITY_STYLES.UNKNOWN;

  return <span className={`${BASE} ${style}`}>{label}</span>;
}