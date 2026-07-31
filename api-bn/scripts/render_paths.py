"""Step 2 of OpenAPI rebuild: synthesize openapi.json `paths` and
`components.schemas` from scripts/routes.json (output of
extract_routes.py).

Each route is classified by `(method, openapi_path)` into one of the
endpoint kinds listed in CLASSIFIERS below; per kind we render a
minimal but honest OpenAPI PathItemObject that references the
shared `schemas` block (also synthesized here).

Output: openapi.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTES_FILE = ROOT / "scripts" / "routes.json"
OPENAPI_FILE = ROOT / "openapi.json"


# ---------------------------------------------------------------------------
# Shared $ref name registry (kept short, explicit)
# ---------------------------------------------------------------------------
REFS = {
    "Error": "#/components/schemas/Error",
    "Pagination": "#/components/schemas/Pagination",
    "BatchIdsRequest": "#/components/schemas/BatchIdsRequest",
    "BatchResponse": "#/components/schemas/BatchResponse",
    "BatchCreateRequest": "#/components/schemas/BatchCreateRequest",
    "ExcelUploadResponse": "#/components/schemas/ExcelUploadResponse",
    "FileResponse": "#/components/schemas/FileResponse",
    "FileUploadRequest": "#/components/schemas/FileUploadRequest",
}


# ---------------------------------------------------------------------------
# Schema components (canonical definitions injected into components.schemas).
# Anything $ref'd in paths must resolve here.
# ---------------------------------------------------------------------------
SHARED_SCHEMAS = {
    "Error": {
        "type": "object",
        "properties": {
            "statusCode": {"type": "integer", "example": 400},
            "message": {"type": "string", "example": "Validation failed"},
            "error": {"type": "string", "nullable": True},
        },
        "required": ["statusCode", "message"],
    },
    "Pagination": {
        "type": "object",
        "properties": {
            "currentPage": {"type": "integer", "example": 1},
            "totalPages": {"type": "integer", "example": 10},
            "totalItems": {"type": "integer", "example": 97},
            "pageSize": {"type": "integer", "example": 10},
        },
        "required": ["currentPage", "totalPages", "totalItems", "pageSize"],
    },
    "BatchIdsRequest": {
        "type": "object",
        "properties": {
            "ids": {
                "type": "array",
                "items": {"type": "string", "format": "uuid"},
                "minItems": 1,
                "description": "List of entity ids",
            },
        },
        "required": ["ids"],
    },
    "BatchResponse": {
        "type": "object",
        "properties": {
            "count": {"type": "integer"},
            "items": {
                "type": "array",
                "items": {"type": "object", "additionalProperties": True},
            },
            "message": {"type": "string"},
        },
        "required": ["count"],
    },
    "BatchCreateRequest": {
        "type": "object",
        "properties": {
            "data": {
                "type": "array",
                "items": {"type": "object", "additionalProperties": True},
                "minItems": 1,
            },
        },
        "required": ["data"],
    },
    "ExcelUploadResponse": {
        "type": "object",
        "properties": {
            "successCount": {"type": "integer"},
            "failedRows": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "row": {"type": "integer"},
                        "error": {"type": "string"},
                    },
                },
            },
        },
        "required": ["successCount", "failedRows"],
    },
    "FileResponse": {
        "type": "string",
        "format": "binary",
    },
    "FileUploadRequest": {
        "type": "object",
        "properties": {
            "file": {"type": "string", "format": "binary"},
            "files": {
                "type": "array",
                "items": {"type": "string", "format": "binary"},
            },
        },
    },
    # Generic entity placeholder, used ONLY for any $ref we forgot to
    # define explicitly.  Marked with a clear PLACEHOLDER description so
    # FE clients know not to trust its shape.
    "Entity": {
        "type": "object",
        "description": (
            "PLACEHOLDER schema. Do NOT rely on this - see backend source "
            "for canonical fields. Endpoints use additionalProperties: true "
            "to remain forward-compatible."
        ),
        "additionalProperties": True,
    },
}

ENUM_SCHEMAS = {
    "TeacherStatus": ["Aktif", "TidakAktif", "Pensiun", "Cuti"],
    "SubjectStatus": ["Aktif", "TidakAktif"],
    "ClassStatus": ["Aktif", "TidakAktif", "Lulus"],
    "SubjectTeacherStatus": ["Aktif", "TidakAktif"],
    "HomeroomTeacherStatus": ["Aktif", "TidakAktif"],
    "PicketStatus": ["Aktif", "TidakAktif"],
    "LessonScheduleStatus": ["Aktif", "TidakAktif"],
    "AttachmentStatus": ["Aktif", "TidakAktif", "Arsip"],
    "InternshipStatus": ["Aktif", "Selesai", "Batal"],
    "QuizStatus": ["Draft", "Published", "Closed"],
    "YearStatus": ["Aktif", "TidakAktif", "Mendatang"],
    "SemesterStatus": ["Aktif", "TidakAktif"],
}
for name, vals in ENUM_SCHEMAS.items():
    SHARED_SCHEMAS[name] = {"type": "string", "enum": vals}


# ---------------------------------------------------------------------------
# Operation builders - one per endpoint classification.
# ---------------------------------------------------------------------------
def ok_200(description="Successful response"):
    return {
        "description": description,
        "content": {"application/json": {"schema": {"$ref": REFS["Error"]}}},
    }


def err_4xx():
    return {
        "description": "Error response",
        "content": {"application/json": {"schema": {"$ref": REFS["Error"]}}},
    }


def ok_paged(entity_name):
    return {
        "description": "Paginated list response",
        "content": {
            "application/json": {
                "schema": {
                    "allOf": [
                        {"$ref": REFS["Pagination"]},
                        {
                            "type": "object",
                            "properties": {
                                "data": {
                                    "type": "object",
                                    "additionalProperties": True,
                                    "description": f"{entity_name} entity (see backend source-of-truth for canonical fields)",
                                }
                            },
                        },
                    ]
                }
            }
        },
    }


def ok_batch_get(entity_name):
    return {
        "description": "Bulk fetched entities",
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer"},
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": True,
                                "description": f"{entity_name} (see backend source-of-truth)",
                            },
                        },
                    },
                }
            }
        },
    }


def ok_simple_batch():
    return {
        "description": "Batch result",
        "content": {"application/json": {"schema": {"$ref": REFS["BatchResponse"]}}},
    }


def ok_excel_upload():
    return {
        "description": "Excel upload result",
        "content": {
            "application/json": {"schema": {"$ref": REFS["ExcelUploadResponse"]}}
        },
    }


def ok_template(filename):
    return {
        "description": f"Excel template file attachment; filename={filename}",
        "content": {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                "schema": {"$ref": REFS["FileResponse"]}
            }
        },
        "headers": {
            "Content-Disposition": {
                "description": f"attachment; filename={filename}",
                "schema": {"type": "string"},
            }
        },
    }


def ok_file_download():
    return {
        "description": "File binary response",
        "content": {
            "application/octet-stream": {"schema": {"$ref": REFS["FileResponse"]}}
        },
    }


def ok_image_response():
    return {
        "description": "Image binary response",
        "content": {
            "image/*": {"schema": {"$ref": REFS["FileResponse"]}}
        },
    }


# ---------------------------------------------------------------------------
# Operation builders per kind
# ---------------------------------------------------------------------------
def build_list(tag, schema_name):
    return {
        "summary": f"List {schema_name} (paginated)",
        "tags": [tag],
        "parameters": [
            {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
            {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 10}},
        ],
        "responses": {"200": ok_paged(schema_name), "4xx": err_4xx()},
    }


def build_create(tag, schema_name):
    return {
        "summary": f"Create single {schema_name}",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": True,
                        "description": f"{schema_name} body (see backend source-of-truth)",
                    }
                }
            },
        },
        "responses": {"201": ok_200("Successfully created"), "4xx": err_4xx()},
    }


def build_get_by_id(tag, schema_name):
    return {
        "summary": f"Get {schema_name} by id",
        "tags": [tag],
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "responses": {"200": ok_200(), "4xx": err_4xx()},
    }


def build_update(tag, schema_name):
    return {
        "summary": f"Update {schema_name} by id (partial)",
        "tags": [tag],
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": True,
                        "description": f"{schema_name} partial body",
                    }
                }
            },
        },
        "responses": {"200": ok_200(), "4xx": err_4xx()},
    }


def build_delete(tag, schema_name):
    return {
        "summary": f"Soft-delete {schema_name} by id",
        "tags": [tag],
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "responses": {"200": ok_200(), "4xx": err_4xx()},
    }


def build_template(tag, template_filename):
    return {
        "summary": "Download Excel import template",
        "description": f"Returns {template_filename} header-only template.",
        "tags": [tag],
        "responses": {"200": ok_template(template_filename), "4xx": err_4xx()},
    }


def build_batch_get(tag, schema_name):
    return {
        "summary": f"Bulk get {schema_name} by ids",
        "description": "POST with JSON { ids: [...] } to bypass URL length limits.",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": {"$ref": REFS["BatchIdsRequest"]}}
            },
        },
        "responses": {"200": ok_batch_get(schema_name), "4xx": err_4xx()},
    }


def build_batch_create(tag, schema_name):
    return {
        "summary": f"Bulk create {schema_name}",
        "description": "POST { data: [entity, ...] }.",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": {"$ref": REFS["BatchCreateRequest"]}}
            },
        },
        "responses": {"200": ok_200("Bulk create result"), "4xx": err_4xx()},
    }


def build_batch_excel(tag, schema_name):
    return {
        "summary": f"Bulk create {schema_name} from Excel",
        "description": "Upload .xlsx file (multipart, field name 'file').",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "Excel file (.xlsx)",
                            }
                        },
                        "required": ["file"],
                    }
                }
            },
        },
        "responses": {"200": ok_excel_upload(), "4xx": err_4xx()},
    }


def build_batch_upload_files(tag, schema_name):
    return {
        "summary": f"Bulk upload files for {schema_name}",
        "description": "Upload many files in a single multipart request (field 'files').",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "files": {
                                "type": "array",
                                "items": {"type": "string", "format": "binary"},
                            }
                        },
                        "required": ["files"],
                    }
                }
            },
        },
        "responses": {"200": ok_200("Upload result"), "4xx": err_4xx()},
    }


def build_batch_delete(tag, schema_name):
    return {
        "summary": f"Bulk soft-delete {schema_name}",
        "tags": [tag],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": {"$ref": REFS["BatchIdsRequest"]}}
            },
        },
        "responses": {"200": ok_simple_batch(), "4xx": err_4xx()},
    }


def build_batch_action(tag, schema_name, action, action_value_payload=None):
    properties = {
        "ids": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
        }
    }
    required = ["ids"]
    if action_value_payload:
        for name, sch in action_value_payload.items():
            properties[name] = sch
            required.append(name)
    return {
        "summary": f"Bulk update {schema_name} by {action}",
        "tags": [tag],
        "parameters": [
            {
                "name": "action",
                "in": "path",
                "required": True,
                "schema": {"type": "string"},
            },
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": properties,
                        "required": required,
                    }
                }
            },
        },
        "responses": {"200": ok_simple_batch(), "4xx": err_4xx()},
    }


def build_sub_resource(tag, method, action_segment):
    return {
        "summary": f"{method.upper()} sub-resource /:{action_segment}",
        "tags": [tag],
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": True,
                    }
                }
            },
        },
        "responses": {"200": ok_200(), "4xx": err_4xx()},
    }


def build_public_file(tag):
    return {
        "summary": "Serve public file",
        "tags": [tag],
        "parameters": [
            {"name": "filename", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "responses": {"200": ok_file_download(), "4xx": err_4xx()},
    }


def build_picture_op(tag, method):
    return {
        "summary": f"{method.upper()} picture for entity",
        "tags": [tag],
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
        ],
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "file": {"type": "string", "format": "binary"},
                        },
                        "required": ["file"],
                    }
                }
            },
        },
        "responses": {"200": ok_image_response(), "4xx": err_4xx()},
    }


def build_statistic(tag):
    return {
        "summary": "Get statistics for the resource",
        "tags": [tag],
        "responses": {"200": ok_200(), "4xx": err_4xx()},
    }


# ---------------------------------------------------------------------------
# Classifier - ordered specific-to-generic.
# ---------------------------------------------------------------------------
PATH_PARAM = re.compile(r"\{([a-zA-Z0-9_]+)\}")


def segment(path: str) -> str:
    """Derive a short `schema_name` for an openapi path.

    E.g. `/api/v1/master/teachers/{id}` -> 'teachers'
         `/api/v1/master/teachers/batch/status` -> 'teachers'
         `/api/v1/master/teacher-unavailabilities/{id}` -> 'teacher-unavailabilities'
    """
    parts = [p for p in path.split("/") if p and not p.startswith("{")]
    # Skip api/v1/{module} prefix (first two parts)
    if len(parts) >= 3 and parts[0] == "api" and parts[1] == "v1":
        parts = parts[2:]
    if not parts:
        return "Entity"
    return parts[0]


def classify(method: str, path: str) -> str:
    """Return one of the builder kinds."""
    # ---- batch operations (most specific) ----
    if method == "POST" and re.search(r"/batch/excel$", path):
        return "batch_excel"
    if method == "POST" and re.search(r"/batch/upload$", path):
        return "batch_upload"
    if method == "POST" and re.search(r"/batch/get$", path):
        return "batch_get"
    if method == "POST" and re.search(r"/batch/delete$", path):
        return "batch_delete"
    if method == "POST" and re.search(r"/batch$", path):
        return "batch_create"
    # PATCH /resource/batch/<action>
    if method == "PATCH" and re.search(r"/batch/[^/]+$", path):
        return "batch_patch_action"
    # DELETE /resource/batch/<action>  (e.g. class-subject-requirements/clear).
    # Without this explicit match it would fall through to `sub_resource`
    # which yields a generic operation shape.
    if method == "DELETE" and re.search(r"/batch/[^/]+$", path):
        return "batch_delete_action"
    if method == "POST" and re.search(r"/batch/[^/]+$", path):
        # POST batch action with custom verb (e.g. update-status, promote)
        return "batch_post_action"
    # ---- template / files ----
    if method == "GET" and re.search(r"/template$", path):
        return "template"
    if method == "GET" and "/attachments/file/" in path:
        return "public_file"
    if method == "GET" and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}/download$", path):
        return "file_download"
    if method == "GET" and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}/certificate$", path):
        return "file_download"
    # ---- picture ----
    if method in ("PUT", "DELETE") and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}/picture$", path):
        return "picture_op"
    # ---- statistic ----
    if method == "GET" and re.search(r"/statistic$|/statistics$", path):
        return "statistic"
    # ---- sub-resource /:id/<verb> ----
    if PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}/.+", path):
        return "sub_resource"
    # ---- CRUD on /{id} ----
    if method == "GET" and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}$", path):
        return "get_by_id"
    if method in ("PATCH", "PUT") and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}$", path):
        return "update"
    if method == "DELETE" and PATH_PARAM.search(path) and re.search(r"/\{[^}]+\}$", path):
        return "delete"
    # ---- list / create ----
    if method == "GET":
        return "list"
    if method == "POST":
        return "create"
    return "custom"


def batch_action_payload(action: str) -> dict | None:
    """Return optional `action_value_payload` extra body fields, if any, for
    a bulk action whose implementation needs additional fields."""
    if action == "promote":
        return {
            "academicYearId": {"type": "string", "format": "uuid"},
            "nextClassId": {"type": "string", "format": "uuid"},
        }
    if action == "retain":
        return {"academicYearId": {"type": "string", "format": "uuid"}}
    if action == "target-hours":
        return {"targetHours": {"type": "integer", "minimum": 0}}
    return None


# ---------------------------------------------------------------------------
# Build openapi doc from routes.json
# ---------------------------------------------------------------------------
def main():
    routes = json.loads(ROUTES_FILE.read_text(encoding="utf-8"))

    paths: dict[str, dict] = {}
    tags_set: set[str] = set()

    for r in routes:
        if r["method"] == "_UNMAPPED_":
            continue
        path = r["openapi_path"]
        method = r["method"].lower()
        tag = r["tag"]
        tags_set.add(tag)

        if not path.startswith("/api/v1/"):
            path = "/api/v1" + path if path.startswith("/") else "/api/v1/" + path
        path_clean = re.sub(r"/+", "/", path)

        kind = classify(method, path_clean)
        schema_name = segment(path_clean)

        try:
            if kind == "list":
                paths.setdefault(path_clean, {})["get"] = build_list(tag, schema_name)
            elif kind == "create":
                paths.setdefault(path_clean, {})["post"] = build_create(tag, schema_name)
            elif kind == "get_by_id":
                paths.setdefault(path_clean, {})["get"] = build_get_by_id(tag, schema_name)
            elif kind == "update":
                paths.setdefault(path_clean, {})["patch"] = build_update(tag, schema_name)
            elif kind == "delete":
                paths.setdefault(path_clean, {})["delete"] = build_delete(tag, schema_name)
            elif kind == "template":
                paths.setdefault(path_clean, {})["get"] = build_template(
                    tag, f"{schema_name}_template.xlsx"
                )
            elif kind == "batch_get":
                paths.setdefault(path_clean, {})["post"] = build_batch_get(tag, schema_name)
            elif kind == "batch_create":
                paths.setdefault(path_clean, {})["post"] = build_batch_create(tag, schema_name)
            elif kind == "batch_excel":
                paths.setdefault(path_clean, {})["post"] = build_batch_excel(tag, schema_name)
            elif kind == "batch_upload":
                paths.setdefault(path_clean, {})["post"] = build_batch_upload_files(tag, schema_name)
            elif kind == "batch_delete":
                paths.setdefault(path_clean, {})["post"] = build_batch_delete(tag, schema_name)
            elif kind == "batch_patch_action":
                # Extract the action name from the path.
                m = re.search(r"/batch/([^/]+)$", path_clean)
                action = m.group(1) if m else "action"
                payload = batch_action_payload(action)
                paths.setdefault(path_clean, {})["patch"] = build_batch_action(
                    tag, schema_name, action, action_value_payload=payload
                )
            elif kind == "batch_post_action":
                m = re.search(r"/batch/([^/]+)$", path_clean)
                action = m.group(1) if m else "action"
                payload = batch_action_payload(action)
                # POST with body {ids, ...}
                paths.setdefault(path_clean, {})["post"] = build_batch_action(
                    tag, schema_name, action, action_value_payload=payload
                )
            elif kind == "batch_delete_action":
                m = re.search(r"/batch/([^/]+)$", path_clean)
                action = m.group(1) if m else "action"
                # DELETE body still wraps ids.
                paths.setdefault(path_clean, {})["delete"] = build_batch_action(
                    tag, schema_name, action, action_value_payload=None
                )
            elif kind == "public_file":
                paths.setdefault(path_clean, {})["get"] = build_public_file(tag)
            elif kind == "file_download":
                paths.setdefault(path_clean, {})["get"] = {
                    "summary": "Download attached file",
                    "tags": [tag],
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
                    ],
                    "responses": {"200": ok_file_download(), "4xx": err_4xx()},
                }
            elif kind == "picture_op":
                paths.setdefault(path_clean, {})[method] = build_picture_op(tag, method)
            elif kind == "statistic":
                paths.setdefault(path_clean, {})["get"] = build_statistic(tag)
            elif kind == "sub_resource":
                # Identify the second segment after /:id/ for a friendly summary.
                m = re.search(r"/\{[^}]+\}/([^/]+)(/.*)?$", path_clean)
                seg = m.group(1) if m else "action"
                paths.setdefault(path_clean, {})[method] = {
                    "summary": f"{method.upper()} sub-resource '{seg}'",
                    "tags": [tag],
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}},
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "additionalProperties": True,
                                }
                            }
                        },
                    },
                    "responses": {"200": ok_200(), "4xx": err_4xx()},
                }
            else:  # custom
                paths.setdefault(path_clean, {})[method] = {
                    "summary": f"{method.upper()} {path_clean}",
                    "tags": [tag],
                    "responses": {"200": ok_200(), "4xx": err_4xx()},
                }
        except Exception as ex:
            print(f"   ! error building op for {method.upper()} {path_clean}: {ex}")

    # Load existing openapi to preserve servers / contact.
    try:
        existing = json.loads(OPENAPI_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        existing = {}

    existing = {
        **existing,
        "openapi": "3.0.3",
        "info": {
            **existing.get("info", {}),
            "title": "BN Apps API",
            "description": (
                "API for BN Apps - Master Data, Academic, Internship, and Learning "
                "management. This spec is regenerated from source-of-truth "
                "(router files) via scripts/extract_routes.py + scripts/render_paths.py. "
                "Batch operations use the 'batch' keyword consistently."
            ),
            "version": "2.1.0",
            "contact": {"name": "BN Apps Team"},
        },
        "servers": existing.get("servers") or [
            {"url": "http://localhost:3000", "description": "Local Development"},
            {"url": "https://api.yourdomain.com", "description": "Production"},
        ],
        "paths": paths,
        "tags": [{"name": t} for t in sorted(tags_set)],
        "components": {
            "securitySchemes": existing.get("components", {}).get(
                "securitySchemes",
                {"BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}},
            ),
            "schemas": SHARED_SCHEMAS,
        },
    }

    OPENAPI_FILE.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    total_ops = sum(len(v) for v in paths.values())
    print(f"OK: wrote {OPENAPI_FILE}")
    print(f"   - path entries : {len(paths)}")
    print(f"   - operations   : {total_ops}")
    print(f"   - tags         : {len(sorted(tags_set))}")
    print(f"   - schemas      : {len(SHARED_SCHEMAS)}")


if __name__ == "__main__":
    main()
