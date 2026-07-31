"""Regression tests for classify() in scripts/render_paths.py.

ORDERING in that function is critical.  Move any line and routes will
silently reclassify into the wrong OpenAPI shape.  Run via:

    python scripts/test_classify.py

Returns exit code 0 on full pass, 1 on any mismatch.
"""
import importlib.util
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location(
    "render_paths", ROOT / "scripts" / "render_paths.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


CASES = [
    # (method, path, expected_kind)
    ("POST", "/api/v1/master/teachers/batch/excel", "batch_excel"),
    ("POST", "/api/v1/learn/attachments/batch/upload", "batch_upload"),
    ("POST", "/api/v1/master/teachers/batch/get", "batch_get"),
    ("POST", "/api/v1/master/teachers/batch/delete", "batch_delete"),
    ("POST", "/api/v1/master/teachers/batch", "batch_create"),
    ("POST", "/api/v1/internship/internship-placements/batch/update-status",
     "batch_post_action"),
    ("PATCH", "/api/v1/master/teachers/batch/status", "batch_patch_action"),
    ("DELETE", "/api/v1/academic/class-subject-requirements/batch/clear",
     "batch_delete_action"),
    ("GET", "/api/v1/master/teachers/template", "template"),
    ("GET", "/api/v1/master/teachers", "list"),
    ("POST", "/api/v1/master/teachers", "create"),
    ("GET", "/api/v1/master/teachers/{id}", "get_by_id"),
    ("PATCH", "/api/v1/master/teachers/{id}", "update"),
    ("DELETE", "/api/v1/master/teachers/{id}", "delete"),
    ("PUT", "/api/v1/master/students/{id}/picture", "picture_op"),
    ("DELETE", "/api/v1/master/students/{id}/picture", "picture_op"),
    ("GET", "/api/v1/learn/attachments/{id}/download", "file_download"),
    ("GET", "/api/v1/internship/attachments/file/{filename}", "public_file"),
    ("GET", "/api/v1/master/students/statistic", "statistic"),
    ("POST", "/api/v1/learn/assignments/{assignmentId}/submissions",
     "sub_resource"),
    ("GET", "/api/v1/learn/quizzes/{quizId}/submissions", "sub_resource"),
]


def main():
    fails = []
    for method, path, expected in CASES:
        got = mod.classify(method, path)
        ok = got == expected
        marker = " OK " if ok else "FAIL"
        print(f"  {marker} {method:6} {path:60}  expect={expected}  got={got}")
        if not ok:
            fails.append((method, path, expected, got))

    print()
    if fails:
        print(f"FAILED {len(fails)}/{len(CASES)} cases")
        sys.exit(1)
    print(f"PASS all {len(CASES)} cases")
    sys.exit(0)


if __name__ == "__main__":
    main()
