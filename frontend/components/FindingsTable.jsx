"use client";

import { Fragment, useMemo, useState } from "react";
import Icon from "./Icons";
import { SeverityBadge, ReachabilityBadge } from "./Badges";
import { normalizeSeverity, severityRank, osvLink } from "@/lib/helpers";

const inputStyle =
  "h-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function DetailBlock({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export default function FindingsTable({ findings }) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [openId, setOpenId] = useState(null);

  // search + filter + sort (most severe first)
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();

    return findings
      .filter((finding) => {
        const level = normalizeSeverity(finding.severity);

        if (severity === "UNRATED") {
          if (level !== "NONE" && level !== "OTHER") return false;
        } else if (severity !== "ALL" && level !== severity) {
          return false;
        }

        if (!text) return true;
        return [finding.package, finding.vulnerabilityId, finding.summary].some(
          (value) => value.toLowerCase().includes(text)
        );
      })
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  }, [findings, query, severity]);

  return (
    <section className="fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Findings</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {visible.length} of {findings.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search package or ID"
              className={`${inputStyle} w-full pl-9 pr-3 sm:w-64`}
            />
          </div>

          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className={`${inputStyle} px-3`}
          >
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="UNRATED">Other / not provided</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3">Package</th>
              <th className="px-5 py-3">Vulnerability</th>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3">Reachability</th>
              <th className="px-5 py-3">Priority</th>
              <th className="w-10 px-3 py-3">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No findings match your search or filter.
                </td>
              </tr>
            )}

            {visible.map((finding) => {
              const isOpen = openId === finding.id;
              const link = osvLink(finding.vulnerabilityId);

              return (
                <Fragment key={finding.id}>
                  <tr
                    onClick={() => setOpenId(isOpen ? null : finding.id)}
                    className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold">{finding.package}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {finding.version}
                      </p>
                    </td>

                    <td className="max-w-sm px-5 py-4 align-top">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="font-mono text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                        >
                          {finding.vulnerabilityId}
                        </a>
                      ) : (
                        <span className="font-mono text-xs font-semibold">
                          {finding.vulnerabilityId}
                        </span>
                      )}
                      <p className="mt-1 line-clamp-2 text-slate-600 dark:text-slate-400">
                        {finding.summary}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <SeverityBadge value={finding.severity} />
                    </td>

                    <td className="px-5 py-4 align-top">
                      <ReachabilityBadge status={finding.reachabilityStatus} />
                    </td>

                    <td className="px-5 py-4 align-top text-slate-600 dark:text-slate-300">
                      {finding.priority}
                    </td>

                    <td className="px-3 py-4 align-top text-slate-400">
                      <Icon
                        name="chevron"
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-5 py-5">
                        <div className="grid gap-6 md:grid-cols-3">
                          <DetailBlock title="Full summary">{finding.summary}</DetailBlock>

                          <DetailBlock title="Reachability basis">
                            {finding.reachabilityBasis}
                          </DetailBlock>

                          <DetailBlock title="References">
                            {finding.references.length === 0 ? (
                              <span className="text-slate-500 dark:text-slate-400">
                                No references provided.
                              </span>
                            ) : (
                              <ul className="space-y-1">
                                {finding.references.slice(0, 5).map((url, index) => (
                                  <li key={`${index}-${url}`} className="truncate">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-600 hover:underline dark:text-indigo-300"
                                    >
                                      {url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </DetailBlock>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}