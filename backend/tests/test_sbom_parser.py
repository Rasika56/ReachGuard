import json
from pathlib import Path

import pytest

from app.sbom_parser import (
    SbomParseError,
    ecosystem_from_purl,
    parse_components,
    parse_sbom_file,
    summarize,
)

FIXTURE = {
    "bomFormat": "CycloneDX",
    "specVersion": "1.5",
    "components": [
        {"type": "library", "name": "lodash", "version": "4.17.20",
         "purl": "pkg:npm/lodash@4.17.20"},
        {"type": "library", "group": "@babel", "name": "core", "version": "7.0.0",
         "purl": "pkg:npm/%40babel/core@7.0.0"},
        {"type": "library", "name": "lodash", "version": "4.17.20",
         "purl": "pkg:npm/lodash@4.17.20"},  # duplicate
        {"type": "library", "name": "no-version"},
        {"type": "library", "version": "1.0.0"},  # no name -> skipped
        {"type": "library", "name": "outer", "version": "1.0.0",
         "purl": "pkg:npm/outer@1.0.0",
         "components": [{"name": "inner", "version": "2.0.0",
                         "purl": "pkg:npm/inner@2.0.0"}]},
    ],
}


def test_ecosystem_from_purl():
    assert ecosystem_from_purl("pkg:npm/lodash@4.17.20") == "npm"
    assert ecosystem_from_purl("pkg:pypi/requests@2.0") == "PyPI"
    assert ecosystem_from_purl("not-a-purl") is None
    assert ecosystem_from_purl(None) is None


def test_parse_components_dedupes_and_nests():
    comps = parse_components(FIXTURE)
    names = [c.name for c in comps]
    assert names.count("lodash") == 1
    assert "@babel/core" in names
    assert "inner" in names          # nested component found
    assert "no-version" in names     # kept, but flagged unsupported
    assert all(c.name for c in comps)


def test_osv_supported_flag():
    comps = {c.name: c for c in parse_components(FIXTURE)}
    assert comps["lodash"].osv_supported
    assert not comps["no-version"].osv_supported
    s = summarize(list(comps.values()))
    assert s["total"] == 5 and s["unsupported"] == 1


def test_parse_file_roundtrip(tmp_path: Path):
    p = tmp_path / "sbom.json"
    p.write_text(json.dumps(FIXTURE))
    assert len(parse_sbom_file(p)) == 5


def test_malformed_json(tmp_path: Path):
    p = tmp_path / "bad.json"
    p.write_text("{ not json")
    with pytest.raises(SbomParseError):
        parse_sbom_file(p)


def test_not_cyclonedx(tmp_path: Path):
    p = tmp_path / "other.json"
    p.write_text(json.dumps({"hello": "world"}))
    with pytest.raises(SbomParseError):
        parse_sbom_file(p)


def test_missing_file(tmp_path: Path):
    with pytest.raises(SbomParseError):
        parse_sbom_file(tmp_path / "nope.json")


def test_empty_components():
    assert parse_components({"bomFormat": "CycloneDX"}) == []
