import Icon from "./Icons";

export default function ScanPanel({ loading, useMock, onToggleMock, onScan, scan }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-lg font-semibold">Scan the sample project</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            ReachGuard builds a CycloneDX SBOM with cdxgen, then checks every
            component against the OSV vulnerability database.
          </p>
          {scan && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Last scan: {new Date(scan.scannedAt).toLocaleString()} · Target:{" "}
              {scan.target}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <button
              type="button"
              role="switch"
              aria-checked={useMock}
              aria-label="Use mock data"
              onClick={() => onToggleMock(!useMock)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                useMock ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                  useMock ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span>Use mock data</span>
          </div>

          <button
            type="button"
            onClick={onScan}
            disabled={loading}
            className="brand-gradient inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Icon name="spinner" className="h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Icon name="play" className="h-4 w-4" />
                Scan Sample Project
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}