import "./globals.css";

export const metadata = {
  title: "ReachGuard | Reachability-aware vulnerability analysis",
  description: "Evidence-aware SBOM vulnerability prioritization with file and function-level findings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
