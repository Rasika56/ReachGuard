import Icon from "./Icons";

const STEPS = [
  {
    title: "Generate SBOM",
    text: "cdxgen lists every package the sample project uses (CycloneDX JSON).",
  },
  {
    title: "Read components",
    text: "The backend pulls out each package name, version and purl.",
  },
  {
    title: "Check OSV",
    text: "Each component is looked up in the OSV vulnerability database.",
  },
  {
    title: "Review findings",
    text: "Results appear here, with honest reachability labels.",
  },
];

export function Notice({ tone = "info", title, children }) {
  const styles = {
    info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-100",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100",
  };

  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm ${styles[tone]}`}>
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function WelcomeState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Ready when you are</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Press <strong>Scan Sample Project</strong> to start. Here is what happens:
      </p>

      <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="brand-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <Icon name="spinner" className="h-5 w-5 animate-spin text-indigo-600" />
        Scan in progress. The backend is building the SBOM and checking OSV, which can
        take up to a minute.
      </div>

      <div className="mt-6 space-y-3 animate-pulse">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex gap-4">
            <div className="h-10 w-1/5 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 flex-1 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-1/6 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-400/30 dark:bg-red-500/10">
      <div className="flex items-start gap-3">
        <Icon
          name="alert"
          className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-300"
        />
        <div>
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            The scan could not be completed
          </h3>
          <p className="mt-1 text-sm text-red-800 dark:text-red-200">{message}</p>
          <p className="mt-2 text-xs text-red-700 dark:text-red-300">
            This is a failed scan, not a clean result. It does not mean &ldquo;no
            vulnerabilities found&rdquo;.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ incomplete }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold">No known vulnerabilities were returned</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        The scan finished and OSV returned no matches for the scanned components. This
        only means nothing was found in OSV for these package versions. It is not a
        guarantee that the project is safe.
      </p>
      {incomplete && (
        <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-300">
          Some lookups reported warnings (see above), so this result may be incomplete.
        </p>
      )}
    </section>
  );
}