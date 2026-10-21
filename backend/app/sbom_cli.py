"""Command-line runner for the SBOM stage: generate + parse + print.

Usage (from the backend/ folder):
    python -m app.sbom_cli
"""
from __future__ import annotations

import json
import sys

from .sbom_parser import parse_sbom_file, summarize
from .scanner import ScanError, generate_sbom


def main() -> int:
    try:
        sbom_path = generate_sbom()
        components = parse_sbom_file(sbom_path)
    except Exception as exc:  # ScanError / SbomParseError
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(f"SBOM written to: {sbom_path}")
    print(json.dumps(summarize(components), indent=2))
    for c in components:
        print(f"  {c.name}@{c.version}  [{c.ecosystem or '?'}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
