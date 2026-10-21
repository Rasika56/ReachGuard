
"""OSV vulnerability checker for ReachGuard."""

from __future__ import annotations

import requests

OSV_QUERY_URL = "https://api.osv.dev/v1/query"


def query_osv(name: str, version: str, ecosystem: str) -> dict:
    """Query OSV for vulnerabilities affecting a package version."""

    if not name or not version or not ecosystem:
        raise ValueError("Name, version, and ecosystem are required.")

    payload = {
        "package": {
            "name": name,
            "ecosystem": ecosystem,
        },
        "version": version,
    }

    response = requests.post(
        OSV_QUERY_URL,
        json=payload,
        timeout=15,
    )
    response.raise_for_status()

    return response.json()


def scan_components(components):
    """Check all OSV-supported SBOM components."""

    results = []

    for component in components:
        if not component.osv_supported:
            results.append({
                "package": component.name,
                "version": component.version,
                "status": "UNSUPPORTED",
                "vulnerabilities": [],
            })
            continue

        ecosystem = component.ecosystem

        if not ecosystem and component.purl:
            ecosystem = _ecosystem_from_purl(component.purl)

        if not ecosystem:
            results.append({
                "package": component.name,
                "version": component.version,
                "status": "UNSUPPORTED",
                "vulnerabilities": [],
            })
            continue

        try:
            response = query_osv(
                component.name,
                component.version,
                ecosystem,
            )
            vulnerabilities = response.get("vulns", [])

            results.append({
                "package": component.name,
                "version": component.version,
                "status": (
                    "VULNERABLE" if vulnerabilities else "NO_KNOWN_VULNERABILITIES"
                ),
                "vulnerabilities": vulnerabilities,
            })

        except (requests.RequestException, ValueError) as exc:
            results.append({
                "package": component.name,
                "version": component.version,
                "status": "ERROR",
                "error": str(exc),
                "vulnerabilities": [],
            })

    return results


def _ecosystem_from_purl(purl: str) -> str | None:
    """Derive the OSV ecosystem using the existing SBOM parser."""
    from .sbom_parser import ecosystem_from_purl

    return ecosystem_from_purl(purl)
