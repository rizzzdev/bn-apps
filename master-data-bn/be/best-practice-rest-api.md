# Panduan Best Practice — REST API dengan Express + TypeScript (Modules-Based Architecture)

Panduan ini bersifat **generik & domain-agnostic** — dapat digunakan untuk membangun REST API apa pun (e-commerce, inventory, CMS, dashboard, dll), tidak terikat pada domain tertentu. Seluruh pola didasarkan pada implementasi nyata yang sudah teruji.

---

## Daftar Isi

1. [Project Setup & Tooling](#1-project-setup--tooling)
2. [Folder `configs/` — Konfigurasi Terpusat](#2-folder-configs---konfigurasi-terpusat)
3. [Folder `app/` & Entry Point `src/index.ts`](#3-folder-app--entry-point-srcindexts)
4. [Arsitektur Module 5-Layer](#4-arsitektur-module-5-layer)
   - [4.1 Struktur Folder Module](#41-struktur-folder-module)
   - [4.2 Domain Layer](#42-domain-layer)
   - [4.3 Repository Layer](#43-repository-layer)
   - [4.4 Service Layer](#44-service-layer)
   - [4.5 Controller Layer](#45-controller-layer)
   - [4.6 Route Layer](#46-route-layer)
5. [Strategi Barrel Export](#5-strategi-barrel-export)
6. [Standard Response Body](#6-standard-response-body)
7. [Error Handling](#7-error-handling)
8. [Middlewares](#8-middlewares)
9. [Utilities](#9-utilities)
10. [Authentication (Sentri)](#10-authentication-sentri)
11. [Special Patterns](#11-special-patterns)
12. [Referensi Lengkap: Module `items`](#12-referensi-lengkap-module-items)

---

## 1. Project Setup & Tooling

### 1.1 `package.json` — Scripts & Dependensi

```jsonc
{
  "scripts": {
    "start": "node dist/index.js",       // production
    "dev": "tsx --watch src/index.ts",    // development (hot reload)
    "build": "tsc && tsc-alias"           // compile TS → JS + resolve path aliases
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.8.0",       // Prisma PostgreSQL adapter
    "@prisma/client": "^7.0.0",           // Prisma ORM client
    "cors": "^2.8.6",                     // CORS middleware
    "dotenv": "^16.6.1",                  // .env loader
    "exceljs": "^4.4.0",                  // Excel read/write
    "express": "^4.22.2",                 // HTTP framework
    "ioredis": "^5.11.1",                 // Redis client
    "multer": "^2.2.0",                   // File upload middleware
    "pg": "^8.22.0",                      // PostgreSQL driver
    "sentri": "^5.2.2",                   // Auth framework
    "zod": "^3.25.76"                     // Schema validation
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.19",
    "prisma": "^7.0.0",
    "tsc-alias": "^1.8.17",              // Resolves path aliases in compiled JS
    "tsx": "^4.22.4",                     // TypeScript executor (dev)
    "typescript": "^5.3.3"
  }
}
```

### 1.2 `tsconfig.json` — Path Alias `@/*`

Path alias `@/*` → `src/*` memungkinkan import bersih tanpa relative path `../../..`.

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowJs": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]          // 👈 Semua import pakai @/
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

> **Catatan**: `tsc-alias` di `build` script diperlukan agar path alias `@/*` di-resolve ke relative path saat kompilasi.

### 1.3 Prisma Setup

```
prisma/
├── schema.prisma          # Definisi model, enum, datasource
├── migrations/            # Migration history
└── prisma.config.ts       # Konfigurasi Prisma (path, env)
```

Model selalu memiliki kolom soft delete:

```prisma
model Item {
  id        String    @id @default(uuid())
  name      String
  // ... field lainnya ...
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
}
```

---

## 2. Folder `configs/` — Konfigurasi Terpusat

Semua file konfigurasi dikumpulkan dalam `src/configs/`. Setiap file bertanggung jawab pada satu aspek konfigurasi.

### 2.1 `configs/env.ts` — Validasi Environment Variables

**Wajib** menggunakan Zod untuk memvalidasi semua environment variable saat startup. Jika ada yang tidak valid, aplikasi harus exit.

```typescript
// src/configs/env.ts
import { config } from "dotenv";
import { z } from "zod";

config(); // Load .env

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLIENT_URL: z.string(),
  REDIS_URL: z.string().optional(),
  PORT: z.string().default("8000").transform(Number),
  CORS_ORIGIN: z.string().optional().default("*"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SALT_ROUNDS: z.string().default("12"),
  API_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format());
  process.exit(1); // 👈 Hard exit — jangan lanjut jika config salah
}

export const env = _env.data;
```

### 2.2 `configs/cors.ts` — CORS Middleware

```typescript
// src/configs/cors.ts
import cors from "cors";
import { env } from "@/configs/env";

const clientOrigins = env.CLIENT_URL.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const corsConfig = cors({
  origin: clientOrigins,
  credentials: true,
});
```

### 2.3 `configs/prisma.ts` — Prisma Client Singleton

Gunakan PostgreSQL adapter untuk koneksi yang efisien. Satu instance PrismaClient untuk seluruh aplikasi.

```typescript
// src/configs/prisma.ts
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/database/generated/client';
import { env } from '@/configs/env';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## 3. Folder `app/` & Entry Point `src/index.ts`

### 3.1 `src/index.ts` — Entry Point

Entry point minimal — hanya setup global dan start server.

```typescript
// src/index.ts
import { createServer } from '@/app/index';
import { env } from '@/configs/env';
import { z } from 'zod';
import { customErrorMap } from '@/utils/zod-error-map';

// Setup global Zod error messages (opsional — bahasa Indonesia, dll)
z.setErrorMap(customErrorMap);

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
```

### 3.2 `src/app/index.ts` — Server Factory

Gunakan **factory function** `createServer()` — bukan langsung export `app`. Ini memudahkan testing dan multi-instance.

```typescript
// src/app/index.ts
import express from "express";
import { corsConfig } from "@/configs/cors";
import { appRoutes } from "@/app/routes";
import { sentriAuth } from "@/database";
import { webhookRoute } from "@/modules/webhook";

export const createServer = () => {
  const app = express();

  // Global middlewares
  app.use(corsConfig);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth routes (public)
  app.use("/api/v1/auth", sentriAuth.router());

  // Webhook routes (API key protected, bukan JWT)
  app.use("/api/v1/webhook", webhookRoute);

  // Protected routes (wajib JWT)
  app.use("/api/v1", appRoutes);

  // Sentri error handler (harus paling akhir)
  app.use(sentriAuth.errorHandler());

  // Auto-migrate sentri tables
  sentriAuth.migrate();

  return app;
};
```

### 3.3 `src/app/routes.ts` — Central Route Aggregation

Semua module route didaftarkan di sini. Ini adalah **satu-satunya tempat** di mana module di-wire ke prefix URL.

```typescript
// src/app/routes.ts
import { Router } from "express";
import { itemsRoute } from "@/modules/items";
import { categoriesRoute } from "@/modules/categories";
import { dashboardRoute } from "@/modules/dashboard";
import { sentriAuth } from "@/database";

export const appRoutes = Router();

// Auth wall — semua route di bawah ini wajib login
appRoutes.use(sentriAuth.protect());

// Mount module routes
appRoutes.use("/items", itemsRoute);
appRoutes.use("/categories", categoriesRoute);
appRoutes.use("/dashboard", dashboardRoute);
```

---

## 4. Arsitektur Module 5-Layer

Ini adalah **pola inti**. Setiap module bisnis besar mengikuti struktur 5-layer:

```
modules/{module-name}/
├── index.ts              ← barrel: HANYA export route
├── domain/
│   ├── index.ts          ← barrel: re-export types, dtos, schemas
│   ├── types.ts          ← type alias dari Prisma
│   ├── dtos.ts           ← DTO types (infer dari Zod schema)
│   └── schemas.ts        ← Zod validation schemas
├── repository/
│   ├── index.ts          ← barrel: re-export repository
│   └── {module}.repository.ts
├── service/
│   ├── index.ts          ← barrel: re-export service
│   └── {module}.service.ts
├── controller/
│   ├── index.ts          ← barrel: re-export controller
│   └── {module}.controller.ts
└── route/
    ├── index.ts          ← barrel: re-export route
    └── {module}.route.ts
```

### 4.1 Struktur Folder Module

Setiap layer punya tanggung jawab yang jelas dan **tidak boleh bocor** ke layer lain:

| Layer | Tanggung Jawab | Boleh Import Dari |
|---|---|---|
| **Domain** | Type definitions, Zod schemas, DTOs | Prisma client types, Zod |
| **Repository** | Akses database (Prisma queries) | Domain (DTOs), Prisma client |
| **Service** | Business logic, caching, webhook | Repository, Domain, Utils |
| **Controller** | HTTP request/response handling | Service, Utils (response) |
| **Route** | HTTP method + path + middleware chain | Domain (schemas), Controller, Middlewares |

### 4.2 Domain Layer

#### `types.ts` — Type Alias dari Prisma Model

```typescript
// src/modules/items/domain/types.ts
import { Item } from '@/database/generated/client';

export type ItemType = Item;
```

#### `schemas.ts` — Zod Validation Schemas

```typescript
// src/modules/items/domain/schemas.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  price: z.number().positive("Harga harus lebih dari 0"),
  categoryId: z.string().uuid("Format ID kategori tidak valid"),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
});

// Update schema = create schema tapi semua field optional
export const updateItemSchema = createItemSchema.partial();

// Bulk schema
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Minimal 1 ID harus dipilih"),
});
```

**Pola lanjutan** — gunakan `transform()` untuk sanitasi input:

```typescript
export const createItemSchema = z.object({
  phone: z.string().trim()
    .transform((v) => v.replace(/\D/g, "")),  // Hapus semua non-digit
  birthdate: z.string()
    .optional()
    .transform((v) => v ? new Date(v) : undefined), // String → Date
  email: z.string().trim().toLowerCase().email(),
});
```

#### `dtos.ts` — TypeScript Types dari Schema

```typescript
// src/modules/items/domain/dtos.ts
import { z } from 'zod';
import { createItemSchema, updateItemSchema } from '@/modules/items/domain/schemas';

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
```

#### `domain/index.ts` — Barrel

```typescript
// src/modules/items/domain/index.ts
export * from '@/modules/items/domain/types';
export * from '@/modules/items/domain/dtos';
export * from '@/modules/items/domain/schemas';
```

### 4.3 Repository Layer

Repository adalah **satu-satunya** tempat yang boleh mengakses Prisma. Semua query database ada di sini.

```typescript
// src/modules/items/repository/items.repository.ts
import { prisma } from '@/configs/prisma';
import { CreateItemDto, UpdateItemDto } from '@/modules/items/domain';

export class ItemRepository {
  async findAll(skip: number, take: number, includeCategory: boolean = false) {
    return prisma.item.findMany({
      where: { deletedAt: null },   // 👈 Soft delete: selalu filter
      skip,
      take,
      include: includeCategory ? { category: true } : undefined,
    });
  }

  async count() {
    return prisma.item.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.item.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: any, excludeId?: string) {
    const where: any = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.item.findFirst({ where });
  }

  async create(data: CreateItemDto) {
    return prisma.item.create({ data: data as any });
  }

  async update(id: string, data: UpdateItemDto) {
    return prisma.item.update({ where: { id }, data: data as any });
  }

  async softDelete(id: string) {
    return prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// 👇 Singleton instance — hanya satu untuk seluruh aplikasi
export const itemRepository = new ItemRepository();
```

### 4.4 Service Layer

Service berisi **business logic**, caching, dan side effects (webhook).

```typescript
// src/modules/items/service/items.service.ts
import { ItemRepository, itemRepository } from '@/modules/items/repository';
import { CreateItemDto, UpdateItemDto } from '@/modules/items/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';
import { sendWebhook } from '@/utils/webhook';

export class ItemService {
  // 👇 Dependency Injection via constructor
  constructor(private repository: ItemRepository) {}

  async getAll(page: number, limit: number) {
    // 👇 Read = cache
    return withCache(`items:all:page:${page}:limit:${limit}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit),
        this.repository.count(),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`items:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Item tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateItemDto) {
    // Validasi unik (contoh: nama tidak boleh duplikat)
    const exists = await this.repository.checkUnique('name', data.name);
    if (exists) throw new BadRequestError('Nama item sudah digunakan');

    const created = await this.repository.create(data);

    // Invalidate cache + webhook
    await clearCachePattern('items:all:*');
    await setCache(`items:id:${created.id}`, created, 600);
    sendWebhook('items', created);

    return created;
  }

  async update(id: string, data: UpdateItemDto) {
    await this.getById(id); // Memastikan item exists

    if (data.name) {
      const exists = await this.repository.checkUnique('name', data.name, id);
      if (exists) throw new BadRequestError('Nama item sudah digunakan');
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern('items:all:*');
    await setCache(`items:id:${id}`, updated, 600);
    sendWebhook('items', updated);

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);

    // 👇 Cek relasi sebelum delete
    const related = await prisma.relatedEntity.findFirst({
      where: { itemId: id, deletedAt: null },
    });
    if (related) throw new BadRequestError('Item masih memiliki relasi aktif');

    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('items:all:*');
    await clearCachePattern(`items:id:${id}`);
    sendWebhook('items', deleted);

    return deleted;
  }

  async bulkDelete(ids: string[]) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.item.findMany({
        where: { id: { in: ids }, deletedAt: null },
      });
      if (items.length !== ids.length) {
        throw new NotFoundError('Beberapa data tidak ditemukan');
      }

      await tx.item.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      await clearCachePattern('items:all:*');
      for (const item of items) {
        await clearCachePattern(`items:id:${item.id}`);
        sendWebhook('items', item);
      }

      return true;
    });
  }
}

// 👇 Singleton instance
export const itemService = new ItemService(itemRepository);
```

### 4.5 Controller Layer

Controller menangani HTTP request/response. **Tidak boleh ada business logic di sini**. Gunakan arrow function untuk auto-bind `this`.

```typescript
// src/modules/items/controller/items.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ItemService, itemService } from '@/modules/items/service';
import { sendResponse } from '@/utils/response';

export class ItemController {
  constructor(private service: ItemService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await this.service.getAll(page, limit);

      const pagination = {
        currentPage: page,
        totalPage: Math.ceil(total / limit),
        totalData: total,
        dataPerPage: limit,
      };

      sendResponse(res, 200, 'Berhasil mengambil data', data, pagination);
    } catch (error) {
      next(error); // 👈 Lempar ke error handler
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id);
      sendResponse(res, 200, 'Berhasil mengambil data', data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      sendResponse(res, 201, 'Berhasil ditambahkan', data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(req.params.id, req.body);
      sendResponse(res, 200, 'Berhasil diperbarui', data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      sendResponse(res, 200, 'Berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.bulkDelete(req.body.ids);
      sendResponse(res, 200, 'Data berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  };
}

export const itemController = new ItemController(itemService);
```

### 4.6 Route Layer

Route mendefinisikan HTTP method + path + middleware chain. **Bulk routes HARUS didefinisikan sebelum `/:id`** untuk menghindari konflik (misal `DELETE /bulk` vs `DELETE /:id`).

```typescript
// src/modules/items/route/items.route.ts
import { validate } from '@/middlewares';
import { Router } from 'express';
import { itemController } from '@/modules/items/controller';
import { sentriAuth } from '@/database';
import {
  createItemSchema,
  updateItemSchema,
  bulkDeleteSchema,
} from '@/modules/items/domain';

export const itemsRoute = Router();

// ⚠️ Bulk routes HARUS di atas /:id
itemsRoute.delete(
  '/bulk',
  sentriAuth.authorize('admin'),
  validate(bulkDeleteSchema),
  itemController.bulkDelete,
);

// CRUD routes
itemsRoute.get('/', itemController.getAll);
itemsRoute.get('/:id', itemController.getById);
itemsRoute.post(
  '/',
  sentriAuth.authorize('admin'),
  validate(createItemSchema),
  itemController.create,
);
itemsRoute.put(
  '/:id',
  sentriAuth.authorize('admin'),
  validate(updateItemSchema),
  itemController.update,
);
itemsRoute.delete(
  '/:id',
  sentriAuth.authorize('admin'),
  itemController.delete,
);
```

#### `route/index.ts` — Barrel

```typescript
export * from '@/modules/items/route/items.route';
```

#### Module Root `index.ts` — HANYA export route

```typescript
// src/modules/items/index.ts
export { itemsRoute } from '@/modules/items/route';
```

> **PENTING**: Module root `index.ts` hanya mengekspor `route`. Tidak boleh mengekspor service, controller, repository, atau domain. Ini adalah kontrak publik module — internal implementation detail tidak boleh bocor.

---

## 5. Strategi Barrel Export

Barrel export adalah aturan ekspor yang memastikan **internal complexity tidak terekspos ke luar**.

### Aturan

| Lokasi | Yang Diekspor | Cara |
|---|---|---|
| `domain/index.ts` | Semua dari `types.ts`, `dtos.ts`, `schemas.ts` | `export * from './file'` |
| `repository/index.ts` | Semua dari `*.repository.ts` | `export * from './file'` |
| `service/index.ts` | Semua dari `*.service.ts` | `export * from './file'` |
| `controller/index.ts` | Semua dari `*.controller.ts` | `export * from './file'` |
| `route/index.ts` | Semua dari `*.route.ts` | `export * from './file'` |
| **Module root** `index.ts` | **HANYA route** | `export { xRoute } from '@/modules/x/route'` |

### Yang BOLEH vs TIDAK BOLEH

```typescript
// ✅ BOLEH — import dari module root (hanya route)
import { itemsRoute } from '@/modules/items';

// ✅ BOLEH — import dari barrel layer (di dalam module yang sama)
import { CreateItemDto } from '@/modules/items/domain';
import { ItemRepository } from '@/modules/items/repository';

// ❌ TIDAK BOLEH — import langsung dari file internal
import { CreateItemDto } from '@/modules/items/domain/dtos';
import { ItemRepository } from '@/modules/items/repository/items.repository';
```

---

## 6. Standard Response Body

**INILAH KONTRAK API**. Setiap endpoint WAJIB mengembalikan format yang seragam — tidak boleh ada variasi format response.

### Definisi Type

```typescript
// src/utils/response.ts
import { Response } from 'express';

export type Pagination = {
  currentPage: number;
  totalPage: number;
  totalData: number;
  dataPerPage: number;
};

export type ApiResponse<T> = {
  error: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: Pagination;
};
```

### Helper Functions

```typescript
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  pagination?: Pagination,
  error: boolean = false,
) => {
  const response: ApiResponse<T> = {
    error,
    statusCode,
    message,
    data,
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
) => {
  return sendResponse(res, statusCode, message, null, undefined, true);
};
```

### Contoh Response

**Success (list dengan pagination):**
```json
{
  "error": false,
  "statusCode": 200,
  "message": "Berhasil mengambil data",
  "data": [{ "id": "...", "name": "Item A" }],
  "pagination": {
    "currentPage": 1,
    "totalPage": 5,
    "totalData": 47,
    "dataPerPage": 10
  }
}
```

**Success (single item):**
```json
{
  "error": false,
  "statusCode": 200,
  "message": "Berhasil mengambil data",
  "data": { "id": "...", "name": "Item A" }
}
```

**Success (delete — data null):**
```json
{
  "error": false,
  "statusCode": 200,
  "message": "Berhasil dihapus",
  "data": null
}
```

**Error:**
```json
{
  "error": true,
  "statusCode": 404,
  "message": "Item tidak ditemukan",
  "data": null
}
```

### Rules

- Semua controller **WAJIB** menggunakan `sendResponse()` — tidak boleh `res.json()` manual
- `data: null` untuk operasi delete atau saat tidak ada data
- `pagination` **hanya** untuk endpoint GET list
- `error: true` untuk response error, `error: false` untuk sukses

---

## 7. Error Handling

### 7.1 Custom Error Classes

Extend `SentriError` agar kompatibel dengan error handler Sentri.

```typescript
// src/errors/index.ts
import { SentriError } from "sentri/express";

export class BadRequestError extends SentriError {
  constructor(message: string = "Bad Request") {
    super("BAD_REQUEST", message, 400);
  }
}

export class UnauthorizedError extends SentriError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends SentriError {
  constructor(message: string = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends SentriError {
  constructor(message: string = "Tidak Ditemukan") {
    super("NOT_FOUND", message, 404);
  }
}

export class InternalServerError extends SentriError {
  constructor(message: string = "Internal Server Error") {
    super("INTERNAL_SERVER_ERROR", message, 500);
  }
}

export class ValidationError extends SentriError {
  constructor(message: string = "Validation Error", public errors?: any) {
    super("VALIDATION_ERROR", message, 400);
  }
}
```

### 7.2 Error Flow

```
Service → throw new NotFoundError(...)
    ↓
Controller → catch (error) { next(error) }
    ↓
Sentri errorHandler → format response JSON
    ↓
Client ← { error: true, statusCode: 404, message: "...", data: null }
```

### 7.3 Aturan Penggunaan

| Situasi | Error Class |
|---|---|
| Data tidak ditemukan | `NotFoundError` |
| Input tidak valid | `BadRequestError` / `ValidationError` |
| Tidak login | `UnauthorizedError` |
| Tidak punya akses | `ForbiddenError` |
| Server error | `InternalServerError` |

---

## 8. Middlewares

### 8.1 Zod Validation Middleware

Generic middleware yang menerima Zod schema dan memvalidasi `req.body`.

```typescript
// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/errors';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError(error.message, error.errors));
      }
      next(error);
    }
  };
};
```

Penggunaan di route:
```typescript
itemsRoute.post('/', validate(createItemSchema), itemController.create);
```

### 8.2 File Upload Middleware (Excel)

```typescript
// src/middlewares/upload.middleware.ts
import multer, { memoryStorage } from 'multer';
import { BadRequestError } from '@/errors';
import { Request } from 'express';

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

const storage = memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (EXCEL_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Hanya file Excel (.xlsx, .xls) yang diperbolehkan'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

export const uploadExcel = upload.single('file');
```

### 8.3 Barrel Export Middlewares

```typescript
// src/middlewares/index.ts
export * from './validate.middleware';
export * from './upload.middleware';
```

---

## 9. Utilities

### 9.1 Redis Caching (`utils/cache.ts`)

Caching layer dengan graceful fallback — aplikasi tetap berjalan walau Redis mati.

```typescript
// src/utils/cache.ts
import Redis from 'ioredis';
import { env } from '@/configs/env';

// Redis client — null jika REDIS_URL tidak diset
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 })
  : null;

export let isRedisConnected = false;

if (redis) {
  redis.connect().catch(() => console.warn('[Cache] Redis tidak tersedia.'));
  redis.on('connect', () => { isRedisConnected = true; });
  redis.on('error', () => { isRedisConnected = false; });
}

/**
 * Bungkus fungsi dengan cache.
 * @param key    Cache key
 * @param ttl    Time-to-live (detik)
 * @param fetcher Fungsi async yang mengambil data dari DB
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (!redis || !isRedisConnected) return fetcher(); // Fallback ke DB

  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch { /* fallback */ }

  const data = await fetcher();

  if (redis && isRedisConnected) {
    redis.set(key, JSON.stringify(data), 'EX', ttl).catch(() => {});
  }

  return data;
}

/** Set cache manual (setelah create/update) */
export async function setCache(key: string, data: unknown, ttl: number) {
  if (redis && isRedisConnected) {
    await redis.set(key, JSON.stringify(data), 'EX', ttl).catch(() => {});
  }
}

/** Hapus cache berdasarkan pattern (pakai SCAN — tidak blocking) */
export async function clearCachePattern(pattern: string) {
  if (!redis || !isRedisConnected) return;

  try {
    let cursor = '0';
    do {
      const res = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = res[0];
      if (res[1].length > 0) await redis.del(...res[1]);
    } while (cursor !== '0');
  } catch { /* fallback */ }
}
```

### 9.2 Webhook (`utils/webhook.ts`)

Mengirim notifikasi ke client eksternal setiap kali data berubah.

```typescript
// src/utils/webhook.ts
import { env } from "@/configs/env";

export const sendWebhook = async <T>(
  moduleName: string,
  data: T,
): Promise<void> => {
  const clientUrls = (env.WEBHOOK_CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (clientUrls.length === 0) return;

  const promises = clientUrls.map(async (baseUrl) => {
    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/webhook/${moduleName}`;

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": env.API_KEY || "",
        },
        body: JSON.stringify({ data }),
      });
    } catch (error) {
      console.error(`[Webhook Error] Gagal mengirim ke ${baseUrl}:`, error);
    }
  });

  await Promise.allSettled(promises); // Jangan reject jika ada yang gagal
};
```

### 9.3 Zod Custom Error Map (`utils/zod-error-map.ts`)

Kustomisasi pesan error Zod (contoh dalam Bahasa Indonesia):

```typescript
// src/utils/zod-error-map.ts
import { z, ZodErrorMap, ZodIssueCode, ZodParsedType } from 'zod';

export const customErrorMap: ZodErrorMap = (issue, ctx) => {
  let message: string;

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = 'Wajib diisi';
      } else {
        message = `Tipe data tidak valid. Diharapkan ${issue.expected}`;
      }
      break;
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') message = 'Format email tidak valid';
      else if (issue.validation === 'url') message = 'Format URL tidak valid';
      else message = 'Format string tidak valid';
      break;
    case ZodIssueCode.too_small:
      message = `Minimal ${issue.minimum} karakter`;
      break;
    case ZodIssueCode.too_big:
      message = `Maksimal ${issue.maximum} karakter`;
      break;
    default:
      message = ctx.defaultError;
  }

  return { message };
};
```

### 9.4 Excel Parser (`utils/excel.ts`)

```typescript
// src/utils/excel.ts
import ExcelJS from 'exceljs';

export async function parseExcel<T = Record<string, unknown>>(
  buffer: Buffer,
  requiredColumns: string[] = [],
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('File Excel tidak memiliki sheet');

  const rows: T[] = [];
  let headers: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headers = (row.values as any[]).slice(1).map((v) => String(v));
    } else {
      const obj: Record<string, unknown> = {};
      let isEmpty = true;
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          const val = cell.value instanceof Date
            ? cell.value.toISOString()
            : cell.text ?? cell.value?.toString() ?? '';
          obj[header] = val;
          if (val.trim() !== '') isEmpty = false;
        }
      });
      if (!isEmpty) rows.push(obj as T);
    }
  });

  if (rows.length === 0) throw new Error('File Excel kosong');

  if (requiredColumns.length > 0) {
    const missing = requiredColumns.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`);
    }
  }

  return rows;
}
```

---

## 10. Authentication (Sentri)

### 10.1 Setup (`database/index.ts`)

```typescript
// src/database/index.ts
import { createAuthExpress } from "sentri/express";
import { PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "@/configs/env";

type Role = "super_admin" | "admin" | "user";

export const sentriAuth = createAuthExpress<Role>({
  mode: "server",

  validRoles: ["super_admin", "admin", "user"],
  validIdentifiers: ["email", "phone", "username"],

  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: env.DATABASE_URL! }),
  }),

  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  saltRounds: parseInt(env.SALT_ROUNDS ?? "12", 10),

  rateLimit: { maxLoginAttempts: 100, maxRegisterAttempts: 100 },
  redisUrl: env.REDIS_URL,
});
```

### 10.2 Penggunaan

| Middleware | Fungsi | Tempat |
|---|---|---|
| `sentriAuth.router()` | Route auth built-in (login, register, dll) | `app/index.ts` |
| `sentriAuth.protect()` | Auth wall — wajib JWT | `app/routes.ts` |
| `sentriAuth.authorize("admin")` | RBAC — cek role spesifik | Route individual |
| `sentriAuth.errorHandler()` | Global error handler | `app/index.ts` (paling akhir) |
| `sentriAuth.migrate()` | Auto-create sentri tables | `app/index.ts` (startup) |

---

## 11. Special Patterns

### 11.1 Soft Delete

Semua operasi delete tidak benar-benar menghapus data, tapi mengisi kolom `deletedAt`.

```typescript
// Repository — semua query filter deletedAt: null
async findAll(skip: number, take: number) {
  return prisma.item.findMany({
    where: { deletedAt: null },  // 👈 Selalu
    skip,
    take,
  });
}

// Soft delete — update, bukan delete
async softDelete(id: string) {
  return prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

Model Prisma harus punya kolom:
```prisma
model Item {
  // ...
  deletedAt DateTime? @map("deleted_at")
}
```

### 11.2 Bulk Operations

Gunakan `prisma.$transaction()` untuk atomicity. Semua operasi bulk dalam satu transaksi — jika ada yang gagal, semua rollback.

```typescript
async bulkDelete(ids: string[]) {
  return prisma.$transaction(async (tx) => {
    // 1. Validasi semua ID valid
    const items = await tx.item.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    if (items.length !== ids.length) {
      throw new NotFoundError('Beberapa data tidak ditemukan');
    }

    // 2. Cek constraint (opsional — cegah delete jika ada relasi)
    // ...

    // 3. Eksekusi
    await tx.item.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });

    // 4. Invalidate cache per item
    for (const item of items) {
      await clearCachePattern(`items:id:${item.id}`);
    }
  });
}
```

### 11.3 Excel Import

Flow: Upload file → Parse Excel → Validasi setiap baris dengan Zod → Bulk insert.

```typescript
// Route
itemsRoute.post('/bulk/excel', uploadExcel, itemController.bulkCreateFromExcel);

// Controller
bulkCreateFromExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await parseExcel(req.file!.buffer, ['name', 'price']);
    const results = await this.service.bulkCreateFromExcel(rows);
    sendResponse(res, 201, `${results.length} item berhasil diimport`, results);
  } catch (error) {
    next(error);
  }
};

// Service
async bulkCreateFromExcel(rows: Record<string, unknown>[]) {
  // Validasi setiap baris dengan Zod
  const validated = rows.map((row) => createItemSchema.parse(row));

  return prisma.$transaction(async (tx) => {
    const created: any[] = [];
    for (const item of validated) {
      created.push(await tx.item.create({ data: item as any }));
    }
    return created;
  });
}
```

### 11.4 Module Tanpa Domain Layer (Dashboard / Aggregation)

Untuk module read-only yang hanya melakukan agregasi data, layer `domain` bisa dihilangkan karena tidak butuh schema validation.

```
modules/dashboard/
├── index.ts
├── controller/
├── service/
└── route/
```

### 11.5 Module Flat / Sederhana

Untuk module sangat sederhana (misal: user management sederhana), bisa menggunakan struktur flat tanpa repository/service terpisah:

```
modules/user/
├── user.controller.ts
└── user.route.ts
```

Gunakan hanya jika module benar-benar sederhana. Begitu logika bisnis mulai kompleks, segera extract ke 5-layer.

### 11.6 Webhook Receiver

Module `webhook` menerima webhook dari service lain (untuk sinkronisasi data).

```typescript
// src/modules/webhook/webhook.route.ts
import { Router, RequestHandler } from 'express';
import { env } from '@/configs/env';
import { prisma } from '@/database';

export const webhookRoute = Router();

const validateApiKey: RequestHandler = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

webhookRoute.use(validateApiKey);

webhookRoute.post('/items/sync', async (_req, res) => {
  const data = await prisma.item.findMany({
    where: { deletedAt: null },
    include: { category: true },
  });
  res.json({ data });
});
```

---

## 12. Referensi Lengkap: Module `items`

Berikut adalah contoh module lengkap yang menggabungkan semua pola di atas:

```
modules/items/
├── index.ts
├── domain/
│   ├── index.ts          → export * from types, dtos, schemas
│   ├── types.ts          → type ItemType = Item
│   ├── dtos.ts           → CreateItemDto, UpdateItemDto (z.infer)
│   └── schemas.ts        → createItemSchema, updateItemSchema, bulkDeleteSchema
├── repository/
│   ├── index.ts          → export * from items.repository
│   └── items.repository.ts → findAll, count, findById, checkUnique, create, update, softDelete
├── service/
│   ├── index.ts          → export * from items.service
│   └── items.service.ts  → getAll, getById, create, update, delete, bulkDelete (with cache + webhook)
├── controller/
│   ├── index.ts          → export * from items.controller
│   └── items.controller.ts → getAll, getById, create, update, delete, bulkDelete
└── route/
    ├── index.ts          → export * from items.route
    └── items.route.ts    → Router: GET /, GET /:id, POST /, PUT /:id, DELETE /:id, DELETE /bulk
```

### Ringkasan Dependency Flow

```
route ──→ validate (middleware) ──→ sentriAuth.authorize (auth)
    │
    └──→ controller ──→ service ──→ repository ──→ Prisma (DB)
                            │
                            ├──→ withCache / setCache / clearCachePattern (Redis)
                            └──→ sendWebhook (HTTP)
```

---

## Checklist — Membangun Module Baru

Saat membuat module baru, ikuti langkah ini:

1. [ ] Buat struktur folder 5-layer
2. [ ] `domain/types.ts` — alias tipe Prisma
3. [ ] `domain/schemas.ts` — Zod schema (create, update, bulk)
4. [ ] `domain/dtos.ts` — infer type dari schema
5. [ ] `domain/index.ts` — barrel export
6. [ ] `repository/*.repository.ts` — query Prisma (soft delete!), singleton instance
7. [ ] `repository/index.ts` — barrel export
8. [ ] `service/*.service.ts` — business logic, cache, webhook, DI constructor, singleton
9. [ ] `service/index.ts` — barrel export
10. [ ] `controller/*.controller.ts` — HTTP handlers, `sendResponse()`, `next(error)`, DI constructor, singleton
11. [ ] `controller/index.ts` — barrel export
12. [ ] `route/*.route.ts` — Router, middleware chain, bulk routes sebelum `/:id`
13. [ ] `route/index.ts` — barrel export
14. [ ] Module `index.ts` — **HANYA** export route
15. [ ] Daftarkan route di `src/app/routes.ts`

---

*Panduan ini dibuat berdasarkan pola arsitektur yang sudah teruji di production. Semua contoh bersifat generik dan dapat diadaptasi ke berbagai domain bisnis.*
