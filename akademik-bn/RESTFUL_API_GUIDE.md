# Panduan Pembuatan RESTful API

Panduan ini berisi arsitektur, struktur folder, teknologi, dan aturan dalam membuat RESTful API yang bersih (clean), modular, dan terukur berdasarkan studi kasus arsitektur backend project ini.

## 🛠 Teknologi Utama
- **Framework:** Express.js (v5.x)
- **Bahasa:** TypeScript
- **Database ORM:** Prisma ORM
- **Validasi Data:** Zod
- **Modul Sistem:** ES Modules (ESM)
- **Environment:** dotenv
- **Development & Build:** tsx, tsc & tsc-alias

## 📂 Struktur Folder
Pendekatan yang digunakan adalah **Modular / Feature-Based Architecture** yang di dalamnya menerapkan pemisahan tugas secara spesifik (Layered Architecture): _Controller, Service, Repository, dan Domain_.

```text
src/
├── app/            # Konfigurasi aplikasi Express, routing global, dan penanganan error
├── configs/        # Konfigurasi pihak ketiga dan environment (cors, env, dsb.)
├── database/       # Koneksi client Prisma
├── errors/         # Kumpulan class Custom Error (NotFoundError, dsb.)
├── lib/            # Setup library eksternal atau third-party services
├── middlewares/    # Middleware global express
├── modules/        # Tempat semua fitur aplikasi (Feature Modules)
│   └── [nama-modul]/
│       ├── controller/ # Menerima request dan mengembalikan response HTTP
│       ├── domain/     # Definisi Zod schema, Types, dan DTO
│       ├── repository/ # Operasi dan query database langsung dengan Prisma
│       ├── route/      # Endpoint / URL route express khusus modul ini
│       ├── service/    # Business logic dan manipulasi entitas
│       └── index.ts    # Entry point ekspor modul
├── utils/          # Fungsi utilitas pembantu (misal: format response)
└── index.ts        # Entry point aplikasi (menjalankan Express server)
```

## 📜 Aturan & Pola (Pattern)

### 1. Pemisahan Tanggung Jawab (Separation of Concerns)
Setiap lapis (layer) hanya punya satu tanggung jawab utama:
- **Router (`route/`)**: Hanya bertugas mendefinisikan endpoint/metode HTTP (GET, POST, dll) dan merutekannya ke Controller.
- **Controller (`controller/`)**: Menangani alur masuk HTTP Request, mem-parsing query/params/body, mengeksekusi Service, dan mengembalikan HTTP Response standar. **Dilarang menaruh logika bisnis dan query database di sini.**
- **Service (`service/`)**: Di sinilah **logika bisnis (Business Logic)** diletakkan. Bertugas memanipulasi data, melakukan validasi logika, melempar custom error, lalu memanggil Repository.
- **Repository (`repository/`)**: Satu-satunya layer yang boleh berinteraksi dengan ORM/Database (Prisma). Dilarang meletakkan logika bisnis di layer ini.
- **Domain (`domain/`)**: Mendefinisikan bentuk data (Schema Zod), tipe TypeScript, dan validasi DTO dari masuk dan keluarnya data untuk modul yang bersangkutan.

### 2. Standarisasi Response API (`utils/response.ts`)
Setiap endpoint API harus mengembalikan format data JSON yang konsisten, baik itu ketika _Success_ maupun _Error_. Hal ini difasilitasi dengan `sendResponse` dan `sendError`.

```typescript
// Contoh Struktur Standar JSON Balikan
export type ApiResponse<T> = {
  error: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: {
    currentPage: number;
    totalPage: number;
    totalData: number;
    dataPerPage: number;
  };
};
```

### 3. Dependency Injection Secara Sederhana
Bisa dilihat di setiap file `index.ts` pada tiap lapisan, class dari Service menerima `Repository` melalui constructor, dan `Controller` menerima `Service` melalui constructor. Ini memudahkan pengetesan (*Unit Testing*) karena kita dapat melakukan _mocking_ data secara independen.

### 4. Global Error Handling (Express 5)
Seluruh *uncaught error* atau error database akan ditangkap oleh middleware error global di `src/app/index.ts`. Controller hanya perlu membungkus eksekusinya dengan blok `try-catch` dan memanggil fungsi `next(error)`.

### 5. Keamanan & Autentikasi Menggunakan Sentri (`sentri/express`)
Proyek ini mengandalkan library `sentri/express` untuk otorisasi endpoint dan penanganan error autentikasi (JWKS token validation).

**a. Konfigurasi Client (`src/lib/sentri.ts`)**
Dideklarasikan instance `sentriAuth` dengan mode client untuk memvalidasi token JWT dari public key JWKS (dari server Master API).
```typescript
import 'dotenv/config';
import { createAuthExpress } from 'sentri/express';

type Role = 'admin' | 'user';

export const sentriAuth = createAuthExpress<Role>({
  mode: 'client',
  keyUri: process.env.MASTER_API_URL! + "/api/v1/auth/keys",
  validRoles: ['admin', 'user'],
});
```

**b. Perlindungan Route (`src/app/routes.ts`)**
Gunakan middleware `sentriAuth.protect()` untuk memblokir akses jika tidak ada token (atau token tidak valid), dan pastikan letaknya sebelum me-registrasikan modul.
```typescript
import { Router } from 'express';
import { sentriAuth } from '@/lib/sentri';
import { usersRoute } from '@/modules/users/route';

export const appRoutes = Router();

// Melindungi SEMUA route di bawah ini
appRoutes.use(sentriAuth.protect());

// (Opsional) Hanya boleh diakses role admin
// appRoutes.use('/users', sentriAuth.authorize(['admin']), usersRoute);

appRoutes.use('/users', usersRoute);
```

**c. Menangani SentriError (`src/app/index.ts`)**
Tangkap instance error khusus dari `SentriError` di handler global. Hal ini memastikan jika token salah/expired, API tetap mengembalikan format struktur `ApiResponse` (JSON) yang konsisten dan bukan HTML Error standar Express.
```typescript
import { SentriError } from 'sentri/express';
import { sendError } from '@/utils/response';

// ...
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SentriError) {
    return sendError(res, err.statusCode, err.message);
  }
  // Error handling ORM & lainnya...
});
```

### 6. Sinkronisasi Data (Shadow Data & Webhooks)
Karena aplikasi ini sering membutuhkan *cache* atau _Shadow Data_ (salinan bayangan) yang aslinya bersumber dari Master API / layanan eksternal, proyek ini mengimplementasikan modul khusus untuk _Webhook_ agar data lokal tetap termutakhirkan.

**a. Webhook Route (`src/modules/webhook/webhook.route.ts`)**
Otorisasi untuk webhook tidak menggunakan Sentri, melainkan _API Key_ khusus `X-Api-Key` untuk komunikasi *server-to-server*. Route ini mendukung 3 pola endpoint fungsional utama:
- `POST /api/v1/webhook/sync-all`: Menarik atau memicu pembaruan semua modul/entitas sekaligus dari server master.
- `POST /api/v1/webhook/:module/sync`: Menarik pembaruan secara spesifik untuk 1 jenis entitas saja (misal: `students`).
- `POST /api/v1/webhook/:module`: Menerima aliran _push data_ secara pasif (data dilempar secara _real-time_ oleh master server bila ada pembaruan di sana).

**b. Webhook Controller (`src/modules/webhook/webhook.controller.ts`)**
Setiap data eksternal yang masuk tidak langsung disetujui. Data tersebut terlebih dahulu **divalidasi kuat (Zod)** menggunakan schema dari _domain_ masing-masing (contohnya `webhookStudentSchema` di modul students). Jika _payload_ sesuai format, data baru diteruskan.

**c. Upsert di Service Layer**
Tiap-tiap modul yang mengelola _shadow data_ (misal: students, teachers, majors) akan menyediakan method khusus bernama `upsertFromWebhook()` di dalam servicenya. Gunanya bukan hanya sekadar menambah (*create*), melainkan menimpa data yang lama jika terdeteksi `id` sudah ada di sistem lokal (*update* / *upsert*), memastikan data lokal bersih dari duplikasi.

Berikut adalah contoh implementasinya pada *Repository* dan *Service*:

```typescript
// 1. Pada Repository (contoh: src/modules/users/repository/users.repository.ts)
async upsert(id: string, data: Partial<UserType>) {
  return prisma.user.upsert({
    where: { id }, // Cari data berdasarkan primary key (ID)
    create: { id, ...data } as any, // Jika belum ada, maka Create data baru
    update: data as any, // Jika ID sudah ada, Update field dengan data baru
  });
}

// 2. Pada Service (contoh: src/modules/users/service/users.service.ts)
async upsertFromWebhook(items: WebhookUserDto[]) {
  // Loop data dari Master API yang sudah melewati validasi Zod
  for (const item of items) {
    await this.repository.upsert(item.id, {
      name: item.name,
      email: item.email,
      // ... mapping field lainnya jika diperlukan ...
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
      lastSyncAt: new Date(), // Catat waktu terakhir sinkronisasi
    });
  }
  return { upserted: items.length }; // Kembalikan informasi kesuksesan
}
```

---

## 💻 Contoh Implementasi (Modul `users`)

Berikut adalah _template boilerplate_ jika Anda ingin membuat modul/entitas baru, contohnya `users`.

### A. Domain (`src/modules/users/domain/schemas.ts`)
Semua schema payload (misal untuk body request Create atau Update) diletakkan di sini, menggunakan Zod.
```typescript
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

// Infer Tipe dari Zod untuk DTO
export type UserDto = z.infer<typeof userSchema>;
```

### B. Repository (`src/modules/users/repository/users.repository.ts`)
Hanya memuat query spesifik modul.
```typescript
import { prisma } from '@/database';

export class UserRepository {
  async findAll(skip: number, take: number) {
    return prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}

// Ekspor instance (Singleton)
export const userRepository = new UserRepository();
```

### C. Service (`src/modules/users/service/users.service.ts`)
Hanya memuat proses pengecekan alur logika.
```typescript
import { UserRepository, userRepository } from '@/modules/users/repository';
import { NotFoundError } from '@/errors';

export class UserService {
  // Inject dependency Repository
  constructor(private repository: UserRepository) {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.repository.findAll(skip, limit);
    return { data, total: data.length }; 
  }

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('User tidak ditemukan');
    return user;
  }
}

export const userService = new UserService(userRepository);
```

### D. Controller (`src/modules/users/controller/users.controller.ts`)
Hanya mem-parsing HTTP Request lalu memanggil service.
```typescript
import type { Request, Response, NextFunction } from 'express';
import { UserService, userService } from '@/modules/users/service';
import { sendResponse } from '@/utils/response';

export class UserController {
  // Inject dependency Service
  constructor(private service: UserService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { data, total } = await this.service.getAll(page, limit);
      
      sendResponse(res, 200, 'Berhasil mengambil data', data, {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      });
    } catch (error) {
      next(error); // Lempar ke Global Error Handler
    }
  };
}

export const userController = new UserController(userService);
```

### E. Router (`src/modules/users/route/users.route.ts`)
Mendefinisikan verb HTTP Endpoint.
```typescript
import { Router } from 'express';
import { userController } from '@/modules/users/controller';

export const usersRoute = Router();

usersRoute.get('/', userController.getAll);
```

### F. Global Routing (`src/app/routes.ts`)
Routing modul individu pada akhirnya akan dipasang pada router aplikasi utama agar terdeteksi.
```typescript
import { Router } from 'express';
import { usersRoute } from '@/modules/users/route';

export const appRoutes = Router();

appRoutes.use('/users', usersRoute);
```

Arsitektur ini memastikan kode Anda bersih, sangat rapi saat aplikasi semakin membesar, dan mudah dimodifikasi satu sama lainnya.
