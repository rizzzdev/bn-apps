# Master Data Backend API Documentation

## Base URL
All endpoints are relative to the base URL:
```
/api/v1
```

## Authentication & Headers
All endpoints (except public auth routes) require authentication.
Pass the JWT Access Token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

## Standard Response Format
The API follows a standard JSON response format:

**Success Response:**
```json
{
  "error": false,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... } // Can be an object, array, or null
}
```

**Paginated Response (for `GET /` endpoints):**
```json
{
  "error": false,
  "statusCode": 200,
  "message": "Success fetch data",
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPage": 5,
    "totalData": 50,
    "dataPerPage": 10
  }
}
```

**Error Response:**
```json
{
  "error": true,
  "statusCode": 400,
  "message": "Error description",
  "data": null
}
```

---

## 1. Auth Module
This project uses **Sentri** for authentication. Auth endpoints are located at `/api/v1/auth`.

| Method   | Endpoint                  | Auth Required | Description                                     |
| -------- | ------------------------- | ------------- | ----------------------------------------------- |
| `POST`   | `/auth/login`             | Public        | Login & get Access/Refresh tokens               |
| `POST`   | `/auth/register`          | Public        | Register new user                               |
| `POST`   | `/auth/refresh`           | Refresh Token | Get new Access Token using Refresh Token        |
| `POST`   | `/auth/logout`            | Refresh Token | Logout current session                          |
| `GET`    | `/auth/me`                | Access Token  | Get current user profile                        |

---

## 2. Academic Year Module

### Endpoints
| Method   | Endpoint                 | Auth Required | Role | Description                  |
| -------- | ------------------------ | ------------- | ---- | ---------------------------- |
| `GET`    | `/academic-years`        | Yes           | Admin| Get all academic years       |
| `GET`    | `/academic-years/:id`    | Yes           | Any  | Get specific academic year   |
| `POST`   | `/academic-years`        | Yes           | Admin| Create new academic year     |
| `PUT`    | `/academic-years/:id`    | Yes           | Admin| Update academic year         |
| `DELETE` | `/academic-years/:id`    | Yes           | Admin| Delete academic year         |

### Query Parameters (for `GET /`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Request Body
**Create:**
```json
{
  "code": "string (optional)",
  "startYear": "integer (required)",
  "endYear": "integer (optional)",
  "status": "'Aktif' | 'Tidak_Aktif' | 'Selesai' (optional)"
}
```
**Update:** Same as Create, but all fields are optional.

---

## 3. Semester Module

### Endpoints
| Method   | Endpoint           | Auth Required | Description                  |
| -------- | ------------------ | ------------- | ---------------------------- |
| `GET`    | `/semesters`       | Yes           | Get all semesters            |
| `GET`    | `/semesters/:id`   | Yes           | Get specific semester        |
| `POST`   | `/semesters`       | Yes           | Create new semester          |
| `PUT`    | `/semesters/:id`   | Yes           | Update semester              |
| `DELETE` | `/semesters/:id`   | Yes           | Delete semester              |

### Request Body
**Create:**
```json
{
  "type": "Enum SemesterType (required)",
  "status": "'Aktif' | 'Tidak_Aktif' | 'Selesai' (optional)",
  "academicYearId": "string UUID (required)"
}
```
**Update:** All fields optional.

---

## 4. Class Module

### Endpoints
| Method   | Endpoint         | Auth Required | Description                  |
| -------- | ---------------- | ------------- | ---------------------------- |
| `GET`    | `/classes`       | Yes           | Get all classes              |
| `GET`    | `/classes/:id`   | Yes           | Get specific class           |
| `POST`   | `/classes`       | Yes           | Create new class             |
| `PUT`    | `/classes/:id`   | Yes           | Update class                 |
| `DELETE` | `/classes/:id`   | Yes           | Delete class                 |

### Request Body
**Create:**
```json
{
  "name": "string (required)",
  "majorId": "string UUID (required)"
}
```
**Update:** All fields optional.

---

## 5. Major Module

### Endpoints
| Method   | Endpoint        | Auth Required | Description                  |
| -------- | --------------- | ------------- | ---------------------------- |
| `GET`    | `/majors`       | Yes           | Get all majors               |
| `GET`    | `/majors/:id`   | Yes           | Get specific major           |
| `POST`   | `/majors`       | Yes           | Create new major             |
| `PUT`    | `/majors/:id`   | Yes           | Update major                 |
| `DELETE` | `/majors/:id`   | Yes           | Delete major                 |

### Request Body
**Create:**
```json
{
  "code": "string (required)",
  "name": "string (required)"
}
```
**Update:** `code` is omitted, `name` is optional.

---

## 6. Student Module

### Endpoints
| Method   | Endpoint          | Auth Required | Description                  |
| -------- | ----------------- | ------------- | ---------------------------- |
| `GET`    | `/students`       | Yes           | Get all students             |
| `GET`    | `/students/:id`   | Yes           | Get specific student         |
| `POST`   | `/students`       | Yes           | Create new student           |
| `PUT`    | `/students/:id`   | Yes           | Update student               |
| `DELETE` | `/students/:id`   | Yes           | Delete student               |

### Request Body
**Create:**
```json
{
  "fullname": "string (required)",
  "nik": "string (optional)",
  "birthplace": "string (optional)",
  "birthdate": "ISO Date String (optional)",
  "gender": "string (optional)",
  "religion": "string (optional)",
  "ethnicGroup": "string (optional)",
  "status": "string (optional)",
  "nis": "string (optional)",
  "nisn": "string (optional)",
  "height": "integer (optional)",
  "weight": "integer (optional)",
  "phoneNumber": "string (optional)",
  "email": "string Email (optional)",
  "userId": "string CUID (required)"
}
```
**Update:** All fields optional. `nik`, `nis`, `nisn`, `userId` are omitted (cannot be updated).

---

## 7. Teacher Module

### Endpoints
| Method   | Endpoint          | Auth Required | Description                  |
| -------- | ----------------- | ------------- | ---------------------------- |
| `GET`    | `/teachers`       | Yes           | Get all teachers             |
| `GET`    | `/teachers/:id`   | Yes           | Get specific teacher         |
| `POST`   | `/teachers`       | Yes           | Create new teacher           |
| `PUT`    | `/teachers/:id`   | Yes           | Update teacher               |
| `DELETE` | `/teachers/:id`   | Yes           | Delete teacher               |

### Request Body
**Create:**
```json
{
  "fullname": "string (required)",
  "nik": "string (optional)",
  "birthplace": "string (optional)",
  "birthdate": "ISO Date String (optional)",
  "gender": "string (optional)",
  "religion": "string (optional)",
  "ethnicGroup": "string (optional)",
  "status": "string (optional)",
  "prefixTitle": "string (optional)",
  "suffixTitle": "string (optional)",
  "nip": "string (optional)",
  "height": "integer (optional)",
  "weight": "integer (optional)",
  "phoneNumber": "string (optional)",
  "email": "string Email (required)",
  "userId": "string (required)",
  "password": "string (required)"
}
```
**Update:** All fields optional. `nik`, `nip`, `userId` are omitted.

---

## 8. Subject Module

### Endpoints
| Method   | Endpoint          | Auth Required | Description                  |
| -------- | ----------------- | ------------- | ---------------------------- |
| `GET`    | `/subjects`       | Yes           | Get all subjects             |
| `GET`    | `/subjects/:id`   | Yes           | Get specific subject         |
| `POST`   | `/subjects`       | Yes           | Create new subject           |
| `PUT`    | `/subjects/:id`   | Yes           | Update subject               |
| `DELETE` | `/subjects/:id`   | Yes           | Delete subject               |

### Request Body
**Create:**
```json
{
  "code": "string (required)",
  "name": "string (required)"
}
```
**Update:** `code` is omitted, `name` is optional.

---

## 9. Dashboard Module

### Endpoints
| Method   | Endpoint                | Auth Required | Description                  |
| -------- | ----------------------- | ------------- | ---------------------------- |
| `GET`    | `/dashboard/summary`    | Yes           | Get dashboard summary data   |

### Response
Returns aggregated summary data, specific implementation is handled by `DashboardService.getSummary()`.
