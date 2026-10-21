import Icon from "./Icons";
import { SEVERITY_ORDER, normalizeSeverity } from "@/lib/helpers";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
};

function highestSeverity(findings) {
  for (const level of SEVERITY_ORDER) {
    if (findings.some((finding) => normalizeSeverity(finding.severity) === level)) {
      return level.charAt(0) + level.slice(1).toLowerCase();
    }
  }
  return findings.length > 0 ? "Not rated" : "None";
}

export default function SummaryCards({ scan }) {
  const findings = scan ? scan.findings : [];

  const cards = [
    {
      label: "Components scanned",
      value: scan ? scan.componentCount : "—",
      icon: "package",
      tone: "indigo",
    },
    {
      label: "Vulnerabilities found",
      value: scan ? findings.length : "—",
      icon: "alert",
      tone: "red",
    },
    {
      label: "Packages affected",
      value: scan ? new Set(findings.map((finding) => finding.package)).size : "—",
      icon: "layers",
      tone: "amber",
    },
    {
      label: "Highest severity",
      value: scan ? highestSeverity(findings) : "—",
      icon: "flag",
      tone: "violet",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONES[card.tone]}`}
            >
              <Icon name={card.icon} className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}