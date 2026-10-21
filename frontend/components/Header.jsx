"use client";

import Icon from "./Icons";

const STATUS = {
  online: { label: "Backend online", dot: "bg-emerald-500" },
  offline: { label: "Backend offline", dot: "bg-red-500" },
  checking: { label: "Checking backend…", dot: "bg-slate-400 animate-pulse" },
};

export default function Header({ backendStatus }) {
  const status = STATUS[backendStatus] || STATUS.checking;

  function toggleTheme() {
    // adds or removes the "dark" class on <html> and remembers the choice
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("reachguard-theme", isDark ? "dark" : "light");
    } catch (e) {
      // storage can be blocked; the toggle still works for this visit
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm">
            <Icon name="shield" className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">ReachGuard</p>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Reachability-aware SBOM prioritization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Switch between light and dark theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="moon" className="h-5 w-5 dark:hidden" />
            <Icon name="sun" className="hidden h-5 w-5 dark:block" />
          </button>
        </div>
      </div>
    </header>
  );
}