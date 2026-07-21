# Dokumentasi Struktur Data Webhook dan Sinkronisasi

Dokumen ini menjelaskan struktur data yang digunakan dalam proses sinkronisasi (*shadow data clone*) dari API eksternal (Master API) ke project ini, serta struktur data internal yang disediakan (diekspor) oleh project ini untuk dikonsumsi oleh sistem/API lain melalui endpoint webhook.

## 1. Bentuk Data dari API Eksternal (Shadow Data Clone)

Project ini menerima dan menarik data dari Master API untuk disinkronkan ke dalam tabel *shadow* lokal. Data ini divalidasi menggunakan skema Zod. Berikut adalah struktur JSON yang diharapkan (berada di dalam array `data` pada response API atau payload webhook):

### a. Academic Year (Tahun Akademik)
```json
{
  "id": "uuid",
  "code": "string",
  "status": "string (opsional)",
  "semesters": [
    {
      "id": "uuid",
      "type": "Ganjil | Genap",
      "status": "string (opsional)"
    }
  ],
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

### b. Major (Jurusan)
```json
{
  "id": "uuid",
  "code": "string",
  "name": "string",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

### c. Class (Kelas)
```json
{
  "id": "uuid",
  "name": "string",
  "majorId": "uuid",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

### d. Teacher (Guru)
```json
{
  "id": "uuid",
  "fullname": "string",
  "prefixTitle": "string | null (opsional)",
  "suffixTitle": "string | null (opsional)",
  "gender": "L | P | null (opsional)",
  "nip": "string | null (opsional)",
  "email": "string | null (opsional)",
  "userId": "string",
  "pictureUrl": "string | null (opsional)",
  "picture": {
    "url": "string | null (opsional)"
  },
  "status": "string (opsional)",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

### e. Student (Siswa)
```json
{
  "id": "uuid",
  "fullname": "string",
  "gender": "L | P | null (opsional)",
  "nis": "string | null (opsional)",
  "nisn": "string | null (opsional)",
  "email": "string | null (opsional)",
  "userId": "string",
  "pictureUrl": "string | null (opsional)",
  "picture": {
    "url": "string | null (opsional)"
  },
  "status": "string | null (opsional)",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

### f. Subject (Mata Pelajaran)
```json
{
  "id": "uuid",
  "code": "string",
  "name": "string",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "deletedAt": "string (ISO 8601 datetime) | null"
}
```

---

## 2. Bentuk Data yang Diekspor Project Ini untuk API Lain

Project ini menyediakan data relasional internal (melalui controller `exportHandlers`) yang dapat dikonsumsi oleh API lain. API lain dapat melakukan *fetch* (HTTP GET/POST) ke endpoint `/api/v1/webhook/:module/sync`. Data akan dikembalikan dalam format array di dalam objek `{ "data": [...] }`.

Berikut adalah struktur data yang dikembalikan beserta relasi tabel (*include*) yang menyertainya:

### a. Major Students (Siswa Jurusan)
Endpoint: `/api/v1/webhook/major-students/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "majorId": "uuid",
      "studentId": "uuid",
      "academicYearId": "uuid",
      "status": "Aktif | Tidak Aktif | Pindah | Lulus",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "major": { /* Objek skema Major utuh */ },
      "student": { /* Objek skema Student utuh */ },
      "academicYear": { /* Objek skema AcademicYear utuh */ }
    }
  ]
}
```

### b. Class Students (Siswa Kelas)
Endpoint: `/api/v1/webhook/class-students/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "classId": "uuid",
      "studentId": "uuid",
      "academicYearId": "uuid",
      "status": "Aktif | Tidak Aktif | Naik Kelas | Tinggal Kelas | Pindah | Lulus",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "class": { /* Objek skema Class utuh */ },
      "student": { /* Objek skema Student utuh */ },
      "academicYear": { /* Objek skema AcademicYear utuh */ }
    }
  ]
}
```

### c. Homeroom Teachers (Wali Kelas)
Endpoint: `/api/v1/webhook/homeroom-teachers/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "teacherId": "uuid",
      "classId": "uuid",
      "academicYearId": "uuid",
      "status": "Aktif | Tidak Aktif",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "teacher": { /* Objek skema Teacher utuh */ },
      "class": { /* Objek skema Class utuh */ },
      "academicYear": { /* Objek skema AcademicYear utuh */ }
    }
  ]
}
```

### d. Major Heads (Kepala Jurusan)
Endpoint: `/api/v1/webhook/major-heads/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "teacherId": "uuid",
      "majorId": "uuid",
      "academicYearId": "uuid",
      "status": "Aktif | Tidak Aktif",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "teacher": { /* Objek skema Teacher utuh */ },
      "major": { /* Objek skema Major utuh */ },
      "academicYear": { /* Objek skema AcademicYear utuh */ }
    }
  ]
}
```

### e. Subject Teachers (Guru Mata Pelajaran)
Endpoint: `/api/v1/webhook/subject-teachers/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "teacherId": "uuid",
      "subjectId": "uuid",
      "status": "Aktif | Tidak Aktif | Lulus",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "teacher": { /* Objek skema Teacher utuh */ },
      "subject": { /* Objek skema Subject utuh */ }
    }
  ]
}
```

### f. Teacher Picket Schedules (Jadwal Piket Guru)
Endpoint: `/api/v1/webhook/teacher-picket-schedules/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "teacherId": "uuid",
      "day": "string",
      "status": "Aktif | Tidak Aktif",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "teacher": { /* Objek skema Teacher utuh */ }
    }
  ]
}
```

### g. Lesson Schedules (Jadwal Pelajaran)
Endpoint: `/api/v1/webhook/lesson-schedules/sync`
```json
{
  "data": [
    {
      "id": "uuid",
      "subjectId": "uuid",
      "lessonHourId": "uuid",
      "day": "Senin | Selasa | Rabu | Kamis | Jumat",
      "notes": "string | null",
      "status": "Aktif | Tidak Aktif",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "deletedAt": "datetime | null",
      "subject": { /* Objek skema Subject utuh */ },
      "lessonHour": {
        "id": "uuid",
        "name": "string",
        "startTime": "string (HH:mm)",
        "endTime": "string (HH:mm)",
        "order": "int",
        "createdAt": "datetime",
        "updatedAt": "datetime",
        "deletedAt": "datetime | null"
      },
      "teachers": [
        {
          "id": "uuid",
          "teacherId": "uuid",
          "createdAt": "datetime",
          "deletedAt": "datetime | null",
          "teacher": { /* Objek skema Teacher utuh */ }
        }
      ],
      "classes": [
        {
          "id": "uuid",
          "classId": "uuid",
          "createdAt": "datetime",
          "deletedAt": "datetime | null",
          "class": { /* Objek skema Class utuh */ }
        }
      ]
    }
  ]
}
```
