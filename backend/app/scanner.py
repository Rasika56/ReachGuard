"""Safe cdxgen execution for ReachGuard.

Only a fixed, pre-configured sample project can be scanned. No user input
ever reaches the command line, and no shell string is built.
"""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_PROJECT_DIR = (REPO_ROOT / "sample-project").resolve()
OUTPUT_DIR = (REPO_ROOT / "output").resolve()
SBOM_PATH = OUTPUT_DIR / "sbom.cdx.json"

CDXGEN_TIMEOUT_SECONDS = 180


class ScanError(Exception):
    """Raised when SBOM generation fails in a way the API should report."""


def validate_target(target: Path = SAMPLE_PROJECT_DIR) -> Path:
    """Confirm the target is the configured sample project and looks like Node.js."""
    target = target.resolve()
    if target != SAMPLE_PROJECT_DIR:
        raise ScanError("Only the configured sample project may be scanned.")
    if not target.is_dir():
        raise ScanError(f"Sample project folder not found: {target}")
    if not (target / "package.json").is_file():
        raise ScanError("Sample project has no package.json.")
    return target


def _find_executable(name: str) -> str | None:
    """Return the full path to a tool, preferring the .cmd launcher on Windows.

    npm installs tools like cdxgen/npx as .cmd files on Windows; subprocess
    cannot start the extensionless shell shim, which causes WinError 2.
    """
    candidates = [f"{name}.cmd", name] if os.name == "nt" else [name]
    for candidate in candidates:
        found = shutil.which(candidate)
        if found:
            return found
    return None


def _cdxgen_command(target: Path, output: Path) -> list[str]:
    """Build the cdxgen argument list (never a shell string)."""
    cdxgen = _find_executable("cdxgen")
    npx = _find_executable("npx")
    if cdxgen:
        base = [cdxgen]
    elif npx:
        base = [npx, "--yes", "@cyclonedx/cdxgen"]
    else:
        raise ScanError(
            "cdxgen not found. Install it with: npm install -g @cyclonedx/cdxgen"
        )
    return base + ["-t", "js", "-o", str(output), str(target)]


def generate_sbom() -> Path:
    """Run cdxgen on the sample project and return the path to the SBOM JSON."""
    target = validate_target()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if SBOM_PATH.exists():
        SBOM_PATH.unlink()  # never return a stale SBOM from a previous run

    cmd = _cdxgen_command(target, SBOM_PATH)
    try:
        result = subprocess.run(
            cmd,
            cwd=target,
            capture_output=True,
            text=True,
            timeout=CDXGEN_TIMEOUT_SECONDS,
            shell=False,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise ScanError(f"cdxgen timed out after {CDXGEN_TIMEOUT_SECONDS}s.") from exc
    except OSError as exc:
        raise ScanError(f"Could not start cdxgen: {exc}") from exc

    if result.returncode != 0:
        tail = (result.stderr or "").strip()[-500:]
        raise ScanError(f"cdxgen failed (exit {result.returncode}): {tail}")
    if not SBOM_PATH.is_file():
        raise ScanError("cdxgen finished but no SBOM file was produced.")
    return SBOM_PATH
