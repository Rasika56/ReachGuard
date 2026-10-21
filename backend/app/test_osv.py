
from osv_client import query_osv

result = query_osv(
    "reachguard-test-package-xyz987",
    "1.0.0",
    "PyPI",
)

vulnerabilities = result.get("vulns", [])

print("Total vulnerabilities:", len(vulnerabilities))

if len(vulnerabilities) == 0:
    print("PASS: No vulnerabilities returned.")
else:
    print("Vulnerability records found:")
    for vuln in vulnerabilities:
        print(vuln.get("id"))
