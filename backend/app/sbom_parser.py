"""CycloneDX JSON parsing for ReachGuard.

Extracts name, version, purl and ecosystem from each component.
Treats the SBOM as untrusted data: every field is validated, nothing is executed.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


class SbomParseError(Exception):
    """Raised when the SBOM file is missing, malformed, or not CycloneDX."""


@dataclass(frozen=True)
class Component:
    name: str
    version: str
    purl: str | None
    ecosystem: str | None
    group: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @property
    def osv_supported(self) -> bool:
        """OSV needs a purl, or a name + version + ecosystem."""
        return bool(self.version and (self.purl or (self.name and self.ecosystem)))


# purl type -> OSV ecosystem name
_PURL_TO_OSV = {
    "npm": "npm",
    "pypi": "PyPI",
    "maven": "Maven",
    "golang": "Go",
    "cargo": "crates.io",
    "nuget": "NuGet",
    "gem": "RubyGems",
    "composer": "Packagist",
}


def ecosystem_from_purl(purl: str | None) -> str | None:
    """'pkg:npm/lodash@4.17.20' -> 'npm'."""
    if not purl or not purl.startswith("pkg:"):
        return None
    purl_type = purl[4:].split("/", 1)[0].lower()
    return _PURL_TO_OSV.get(purl_type)


def load_sbom(path: Path) -> dict[str, Any]:
    try:
        raw = Path(path).read_text(encoding="utf-8")
    except OSError as exc:
        raise SbomParseError(f"Cannot read SBOM file: {exc}") from exc
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SbomParseError(f"SBOM is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise SbomParseError("SBOM root must be a JSON object.")
    if data.get("bomFormat") != "CycloneDX":
        raise SbomParseError("File is not a CycloneDX SBOM (bomFormat != 'CycloneDX').")
    return data


def _walk(components: Any):
    """Yield components, including nested ones."""
    if not isinstance(components, list):
        return
    for item in components:
        if isinstance(item, dict):
            yield item
            yield from _walk(item.get("components"))


def parse_components(sbom: dict[str, Any]) -> list[Component]:
    """Return de-duplicated components in first-seen order."""
    seen: set[tuple[str, str, str | None]] = set()
    result: list[Component] = []
    for raw in _walk(sbom.get("components")):
        name = raw.get("name")
        version = raw.get("version")
        if not isinstance(name, str) or not name:
            continue
        if not isinstance(version, str):
            version = ""
        purl = raw.get("purl") if isinstance(raw.get("purl"), str) else None
        group = raw.get("group") if isinstance(raw.get("group"), str) else None
        full_name = f"{group}/{name}" if group and not name.startswith(group) else name
        key = (full_name, version, purl)
        if key in seen:
            continue
        seen.add(key)
        result.append(
            Component(
                name=full_name,
                version=version,
                purl=purl,
                ecosystem=ecosystem_from_purl(purl),
                group=group,
            )
        )
    return result


def parse_sbom_file(path: Path) -> list[Component]:
    return parse_components(load_sbom(path))


def summarize(components: list[Component]) -> dict[str, int]:
    return {
        "total": len(components),
        "osv_supported": sum(1 for c in components if c.osv_supported),
        "unsupported": sum(1 for c in components if not c.osv_supported),
    }
