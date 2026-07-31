"""Step 1 of OpenAPI rebuild: extract every registered Express handler
in this multi-module project and compute its absolute OpenAPI URL.

Source-of-truth: orchestrator index.ts files.  We compile a flat
mount table by hand from them (no AST parsing).  Whenever a route file
gets imported in a module index and `router.use(prefix, xRoute)` is
called, that file's handlers resolve to `<module-prefix><sub-prefix><segment>`.

Output: scripts/routes.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "scripts" / "routes.json"

# Top-level mounts (src/app/routes/index.ts)
MODULE_PREFIX = {
    "auth": "/api/v1/auth",
    "master": "/api/v1/master",
    "academic": "/api/v1/academic",
    "internship": "/api/v1/internship",
    "learn": "/api/v1/learn",
}

# Per-module mount table. Key is (module, route-file-basename) so identical
# file names like `attachment.route.ts` in 3 modules map correctly.
SUBROUTER_MOUNT = {
    # auth
    ("auth", "user.route.ts"): "/users",
    # master
    ("master", "academic-year.route.ts"): "/academic-years",
    ("master", "semester.route.ts"): "/semesters",
    ("master", "class.route.ts"): "/classes",
    ("master", "major.route.ts"): "/majors",
    ("master", "student.route.ts"): "/students",
    ("master", "teacher.route.ts"): "/teachers",
    ("master", "subject.route.ts"): "/subjects",
    ("master", "attachment.route.ts"): "/attachments",
    ("master", "application.route.ts"): "/applications",
    ("master", "dashboard.route.ts"): "/dashboard",
    # academic
    ("academic", "teacher-unavailabilities.route.ts"): "/teacher-unavailabilities",
    ("academic", "major-students.route.ts"): "/major-students",
    ("academic", "class-students.route.ts"): "/class-students",
    ("academic", "subject-teachers.route.ts"): "/subject-teachers",
    ("academic", "homeroom-teachers.route.ts"): "/homeroom-teachers",
    ("academic", "major-heads.route.ts"): "/major-heads",
    ("academic", "teacher-picket-schedules.route.ts"): "/teacher-picket-schedules",
    ("academic", "lesson-hours.route.ts"): "/lesson-hours",
    ("academic", "lesson-schedules.route.ts"): "/lesson-schedules",
    ("academic", "class-subject-requirements.route.ts"): "/class-subject-requirements",
    ("academic", "generator.route.ts"): "/lesson-schedules/generator",
    # internship
    ("internship", "student.route.ts"): "/students",
    ("internship", "teacher.route.ts"): "/teachers",
    ("internship", "company.route.ts"): "/companies",
    ("internship", "industry-mentor.route.ts"): "/industry-mentors",
    ("internship", "internship-placement.route.ts"): "/internship-placements",
    ("internship", "daily-logbook.route.ts"): "/daily-logbooks",
    ("internship", "assessment.route.ts"): "/assessments",
    ("internship", "attachment.route.ts"): "/attachments",
    ("internship", "activity.route.ts"): "/activities",
    ("internship", "dashboard.route.ts"): "/dashboard",
    ("internship", "attendance.route.ts"): "/attendances",
    # learn
    ("learn", "attachment.route.ts"): "/attachments",
    ("learn", "material.route.ts"): "/materials",
    ("learn", "assignment.route.ts"): "/assignments",
    ("learn", "assignment-submission.route.ts"): "/assignment-submissions",
    ("learn", "quiz.route.ts"): "/quizzes",
    ("learn", "grade.route.ts"): "/grades",
    ("learn", "dashboard.route.ts"): "/dashboard",
}

# Tags per (module, file).  Auto-derived from SUBROUTER_MOUNT keys; if you
# want a custom human label override here.
def default_tag(prefix: str) -> str:
    parts = prefix.strip("/").split("/")
    if not parts:
        return "Default"
    resource = parts[-1].replace("-", " ").title()
    # Module name heuristic from module label of caller.
    return resource


TAGS = {
    ("auth", "user.route.ts"): "Auth - Users",
    ("master", "academic-year.route.ts"): "Master - Academic Years",
    ("master", "semester.route.ts"): "Master - Semesters",
    ("master", "class.route.ts"): "Master - Classes",
    ("master", "major.route.ts"): "Master - Majors",
    ("master", "student.route.ts"): "Master - Students",
    ("master", "teacher.route.ts"): "Master - Teachers",
    ("master", "subject.route.ts"): "Master - Subjects",
    ("master", "attachment.route.ts"): "Master - Attachments",
    ("master", "application.route.ts"): "Master - Applications",
    ("master", "dashboard.route.ts"): "Master - Dashboard",
    ("academic", "teacher-unavailabilities.route.ts"): "Academic - Teacher Unavailabilities",
    ("academic", "major-students.route.ts"): "Academic - Major Students",
    ("academic", "class-students.route.ts"): "Academic - Class Students",
    ("academic", "subject-teachers.route.ts"): "Academic - Subject Teachers",
    ("academic", "homeroom-teachers.route.ts"): "Academic - Homeroom Teachers",
    ("academic", "major-heads.route.ts"): "Academic - Major Heads",
    ("academic", "teacher-picket-schedules.route.ts"): "Academic - Teacher Picket Schedules",
    ("academic", "lesson-hours.route.ts"): "Academic - Lesson Hours",
    ("academic", "lesson-schedules.route.ts"): "Academic - Lesson Schedules",
    ("academic", "class-subject-requirements.route.ts"): "Academic - Class Subject Requirements",
    ("academic", "generator.route.ts"): "Academic - Timetable Generator",
    ("internship", "student.route.ts"): "Internship - Students",
    ("internship", "teacher.route.ts"): "Internship - Teachers",
    ("internship", "company.route.ts"): "Internship - Companies",
    ("internship", "industry-mentor.route.ts"): "Internship - Industry Mentors",
    ("internship", "internship-placement.route.ts"): "Internship - Internship Placements",
    ("internship", "daily-logbook.route.ts"): "Internship - Daily Logbooks",
    ("internship", "assessment.route.ts"): "Internship - Assessments",
    ("internship", "attachment.route.ts"): "Internship - Attachments",
    ("internship", "activity.route.ts"): "Internship - Activities",
    ("internship", "dashboard.route.ts"): "Internship - Dashboard",
    ("internship", "attendance.route.ts"): "Internship - Attendances",
    ("learn", "attachment.route.ts"): "Learn - Attachments",
    ("learn", "material.route.ts"): "Learn - Materials",
    ("learn", "assignment.route.ts"): "Learn - Assignments",
    ("learn", "assignment-submission.route.ts"): "Learn - Assignment Submissions",
    ("learn", "quiz.route.ts"): "Learn - Quizzes",
    ("learn", "grade.route.ts"): "Learn - Grades",
    ("learn", "dashboard.route.ts"): "Learn - Dashboard",
}


METHOD_RE = re.compile(
    r"""^\s*([A-Za-z]\w*)\.(get|post|patch|put|delete)\(\s*['"]([^'"]+)['"]""",
    re.MULTILINE,
)


def normalize(seg: str) -> str:
    seg = re.sub(r"/+", "/", seg)
    return re.sub(r":([a-zA-Z0-9_]+)", r"{\1}", seg)


def file_module(rel: str) -> str:
    rel = rel.replace("\\", "/")
    for mod in MODULE_PREFIX:
        if rel.startswith(f"src/{mod}/") or rel == f"src/{mod}":
            return mod
    return "?"


def collect():
    out = []
    for route_file in SRC.rglob("*.route.ts"):
        rel = str(route_file.relative_to(ROOT)).replace("\\", "/")
        mod = file_module(rel)
        if mod == "?":
            continue
        sub = SUBROUTER_MOUNT.get((mod, route_file.name))
        tag = TAGS.get((mod, route_file.name), "?")
        # Special: quiz-submission file is mounted ONLY at the nested
        # /quizzes/:quizId/submissions path.  Its routes are emitted as
        # DIRECT_MOUNTS below - skip walking the file entirely.
        if route_file.name == "quiz-submission.route.ts":
            continue
        if sub is None:
            out.append({
                "module": mod, "tag": "?",
                "method": "_UNMAPPED_",
                "openapi_path": f"/api/v1/_UNMAPPED_{rel}",
                "express_segment": rel,
                "source_file": rel,
            })
            continue
        # Special: quiz-submission is mounted ONLY at the nested
        # /quizzes/:quizId/submissions path.  Skip walking the file -
        # its routes get explicit DIRECT_MOUNTS below.
        if route_file.name == "quiz-submission.route.ts":
            continue
        full_prefix = MODULE_PREFIX[mod] + sub
        text = route_file.read_text(encoding="utf-8")
        for m in METHOD_RE.finditer(text):
            method = m.group(2).upper()
            seg_raw = m.group(3)
            # For assignment-submission.route.ts only collect the
            # `directSubmissionRoute` exports (the nested `assignmentSubmissionRoute`
            # is already covered by DIRECT_MOUNTS).
            if route_file.name == "assignment-submission.route.ts":
                if m.group(1) != "directSubmissionRoute":
                    continue
            seg = normalize(seg_raw)
            seg_norm = "/" + seg if seg and not seg.startswith("/") else seg
            out.append({
                "module": mod, "tag": tag, "method": method,
                "openapi_path": f"{full_prefix}{seg_norm}",
                "express_segment": seg_raw,
                "source_file": rel,
            })

    # Edge cases that cannot be discovered by simple file walking.
    special = [
        # Internship public file serving (declared inline at internship router)
        {
            "module": "internship", "tag": "Internship - Attachments",
            "method": "GET",
            "openapi_path": "/api/v1/internship/attachments/file/{filename}",
            "express_segment": "/file/:filename",
            "source_file": "src/internship/src/routes/index.ts inline",
        },
        # Learn nested assignment submissions (mounted at
        # /assignments/:assignmentId/submissions).
        {"module": "learn", "tag": "Learn - Submissions",
         "method": "POST",
         "openapi_path": "/api/v1/learn/assignments/{assignmentId}/submissions",
         "express_segment": "/",
         "source_file": "src/learn/routes/index.ts nested"},
        {"module": "learn", "tag": "Learn - Submissions",
         "method": "GET",
         "openapi_path": "/api/v1/learn/assignments/{assignmentId}/submissions",
         "express_segment": "/",
         "source_file": "src/learn/routes/index.ts nested"},
        {"module": "learn", "tag": "Learn - Submissions",
         "method": "GET",
         "openapi_path": "/api/v1/learn/assignments/{assignmentId}/submissions/my",
         "express_segment": "/my",
         "source_file": "src/learn/routes/index.ts nested"},
        # Learn nested quiz submissions (mounted at /quizzes/:quizId/submissions).
        {"module": "learn", "tag": "Learn - Quiz Submissions",
         "method": "POST",
         "openapi_path": "/api/v1/learn/quizzes/{quizId}/submissions/start",
         "express_segment": "/start",
         "source_file": "src/learn/routes/index.ts nested"},
        {"module": "learn", "tag": "Learn - Quiz Submissions",
         "method": "POST",
         "openapi_path": "/api/v1/learn/quizzes/{quizId}/submissions/finish",
         "express_segment": "/finish",
         "source_file": "src/learn/routes/index.ts nested"},
        {"module": "learn", "tag": "Learn - Quiz Submissions",
         "method": "GET",
         "openapi_path": "/api/v1/learn/quizzes/{quizId}/submissions/my",
         "express_segment": "/my",
         "source_file": "src/learn/routes/index.ts nested"},
        {"module": "learn", "tag": "Learn - Quiz Submissions",
         "method": "GET",
         "openapi_path": "/api/v1/learn/quizzes/{quizId}/submissions",
         "express_segment": "/",
         "source_file": "src/learn/routes/index.ts nested"},
    ]
    return sorted(out + special, key=lambda e: (e["module"], e["openapi_path"], e["method"]))


def main():
    res = collect()
    OUT.write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    unmapped = [e["express_segment"] for e in res if e["method"] == "_UNMAPPED_"]
    print(f"OK: wrote {OUT}")
    print(f"   - total entries      : {len(res)}")
    print(f"   - unmapped route files: {len(unmapped)}")
    for u in unmapped:
        print(f"     * {u}")


if __name__ == "__main__":
    main()
