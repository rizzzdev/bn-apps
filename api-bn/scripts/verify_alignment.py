"""Verify openapi.json alignment with the live API surface.

Live routes: read from scripts/routes.json (output of extract_routes.py).
Spec:        read from openapi.json paths entries.

We compare both as `(method, normalized_path)` tuples.  Trailing slashes are
stripped from both sides before comparison so Express paths like
`GET /teachers/` and OpenAPI paths like `/teachers` are treated as the
same resource.  Both sides already include the /api/v1 module prefix.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTES_FILE = ROOT / "scripts" / "routes.json"
OPENAPI_FILE = ROOT / "openapi.json"


def strip_trailing(s: str) -> str:
    return re.sub(r"/+$", "", s) or "/"


def collect_live():
    routes = json.loads(ROUTES_FILE.read_text(encoding="utf-8"))
    out = set()
    for r in routes:
        if r["method"] == "_UNMAPPED_":
            continue
        out.add((r["method"].upper(), strip_trailing(r["openapi_path"])))
    return out


def collect_spec():
    doc = json.loads(OPENAPI_FILE.read_text(encoding="utf-8"))
    out = set()
    for path, methods in doc.get("paths", {}).items():
        if not path.startswith("/api/v1"):
            path = f"/api/v1{path}"
        for m in methods:
            if m in ("get", "post", "patch", "put", "delete"):
                out.add((m.upper(), strip_trailing(path)))
    return out


def main():
    live = collect_live()
    spec = collect_spec()

    only_in_live = sorted(live - spec)
    only_in_spec = sorted(spec - live)
    intersect = live & spec

    print("=" * 78)
    print("openapi.json alignment report")
    print("=" * 78)
    print(f"Live routes      : {len(live)}")
    print(f"Spec entries     : {len(spec)}")
    print(f"In both (OK)     : {len(intersect)}")
    print(f"MISSING          : {len(only_in_live)}  (live-only)")
    print(f"ASPIRATIONAL     : {len(only_in_spec)}  (spec-only)")
    coverage = (len(intersect) / max(len(live), 1)) * 100
    print(f"Coverage         : {coverage:.1f}%  (intersect / live)")
    print()

    # Per-module breakdown
    by_live, by_spec = {}, {}
    for m, p in live:
        mod = p.split("/")[3] if p.startswith("/api/v1/") else "?"
        by_live[mod] = by_live.get(mod, 0) + 1
    for m, p in spec:
        mod = p.split("/")[3] if p.startswith("/api/v1/") else "?"
        by_spec[mod] = by_spec.get(mod, 0) + 1
    print("Per-module (live | spec):")
    for mod in sorted(set(by_live) | set(by_spec)):
        l = by_live.get(mod, 0)
        s = by_spec.get(mod, 0)
        marker = " OK " if l == s else ("+" if l > s else "-")
        print(f"  {marker} {mod:18} live={l:4}  spec={s:4}  delta={l - s:+d}")
    print()

    if only_in_live:
        print("-" * 78)
        print(f"MISSING - {len(only_in_live)} live routes with no spec entry:")
        print("-" * 78)
        for m, p in only_in_live[:60]:
            print(f"  {m:6} {p}")
        if len(only_in_live) > 60:
            print(f"  ... +{len(only_in_live) - 60} more")
    if only_in_spec:
        print("-" * 78)
        print(f"ASPIRATIONAL - {len(only_in_spec)} spec entries with no live route:")
        print("-" * 78)
        for m, p in only_in_spec[:60]:
            print(f"  {m:6} {p}")
        if len(only_in_spec) > 60:
            print(f"  ... +{len(only_in_spec) - 60} more")

    # Exit codes for CI gate:
    #   2 = spec contains aspirational entries (broken SDK promises) - HARD FAIL
    #   1 = coverage below 95% or live-only entries present (route drifted) - FAIL
    #   0 = spec is correctly aligned with live API
    import sys
    if only_in_spec:
        sys.exit(2)
    if coverage < 95 or only_in_live:
        sys.exit(1)


if __name__ == "__main__":
    main()
