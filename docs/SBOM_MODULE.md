# SBOM module (Person 3)

Owns: `sample-project/`, `backend/app/scanner.py`, `backend/app/sbom_parser.py`, `backend/tests/test_sbom_parser.py`.

## One-time setup
```bash
node -v                                  # Node 18+ recommended
npm install -g @cyclonedx/cdxgen         # or rely on npx fallback in scanner.py
cd sample-project && npm install         # creates package-lock.json + node_modules
```
Commit `package-lock.json`; do NOT commit `node_modules/`.

## Run the SBOM stage on its own
```bash
cd backend
python -m app.sbom_cli
```
Writes `output/sbom.cdx.json` and prints the component count.

## Tests
```bash
cd backend
pip install pytest
python -m pytest -q
```

## Interface other teammates use
```python
from app.scanner import generate_sbom, ScanError
from app.sbom_parser import parse_sbom_file, summarize, Component

path = generate_sbom()               # Path to output/sbom.cdx.json
components = parse_sbom_file(path)   # list[Component]
summarize(components)                # {"total": N, "osv_supported": M, "unsupported": K}
```
`Component` fields: `name`, `version`, `purl`, `ecosystem` (OSV name, e.g. `npm`), `group`.
Errors: `ScanError` (cdxgen problems), `SbomParseError` (bad file). Person 2 should turn both into safe API errors.

## Known limits (state these in the demo)
- SBOM covers only what cdxgen finds; absence from the SBOM is not proof of absence from the app.
- Without a lockfile / `npm install`, cdxgen may miss transitive dependencies.
