## Frontend Development Guidelines (Master Data BN)

When working on the frontend in this workspace, strictly adhere to the following rules:

### 1. Technology Stack
- **Framework:** SvelteKit 2 with **Svelte 5** (Use Runes).
- **Styling:** Tailwind CSS v4 with Neo-brutalism design.
- **Language:** TypeScript. Define types/interfaces in `src/lib/types.ts`.
- **Build Tool:** Vite.

### 2. Directory Structure & Architecture
- **Atomic Design** for UI components and **Feature-Sliced Design** for business logic.
- `src/lib/components/`: Pure, "dumb" UI components (atoms, molecules, organisms, templates). **NO business logic or API calls here.**
- `src/lib/features/[feature-name]/`: Business logic per domain (e.g., auth, student).
- `src/routes/`: SvelteKit pages that assemble layouts and feature components.

### 3. Svelte 5 (Runes) Rules
- **Do not use** Svelte 4 syntax (`export let`, `$:`, `<slot />`, `writable`).
- **Props:** Use `let { ... } = $props<{ ... }>();`
- **State:** Use `let count = $state(0);`
- **Derived:** Use `let isDouble = $derived(count * 2);`
- **Snippets:** Use `{@render children?.()}` instead of `<slot />`.

### 4. Styling (Neo-brutalism)
- Use thick borders (e.g., `border-3 border-on-background`).
- Use sharp, solid shadows without blur (e.g., `shadow-neo`, `shadow-neo-sm`).
- Add translate effects on hover (e.g., `hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs`).
- Use global color semantic variables (e.g., `bg-primary`, `bg-error`), avoid raw colors like `bg-blue-500`.

### 5. API Interaction (`apiClient`)
- **NEVER** use native `fetch` directly for backend calls.
- Always use the `apiClient` wrapper from `src/lib/utils/api.ts` (handles auth headers, cookies, and token refresh).
- Example:
  ```typescript
  import { apiClient } from '$lib/utils/api';
  // ... inside try-catch ...
  const res = await apiClient('/students/statistic');
  const result = await res.json();
  ```

### 6. Global State Management (Class-Based)
- Avoid Svelte 4 `writable` stores.
- Use **Class-Based State** by declaring `$state` properties inside a class and exporting an instance of it.
  ```typescript
  class ToastState {
      toasts = $state<ToastMessage[]>([]);
      add(type, message) { /* logic */ }
  }
  export const toast = new ToastState();
  ```

---

## Backend Development Guidelines (RESTful API)

When working on the backend in this workspace, strictly adhere to the following rules:

### 1. Technology Stack
- **Framework:** Express.js (v5.x)
- **Language:** TypeScript
- **Database ORM:** Prisma ORM
- **Validation:** Zod
- **Module System:** ES Modules (ESM)

### 2. Modular Architecture (Layered)
Follow a Feature-Based Architecture with strict separation of concerns in `src/modules/[module-name]/`:
- **Router (`route/`)**: Defines HTTP endpoints and routes to Controller.
- **Controller (`controller/`)**: Handles HTTP Req/Res. **NO business logic or DB queries here.**
- **Service (`service/`)**: Contains **business logic**, manipulates data, throws custom errors, calls Repository.
- **Repository (`repository/`)**: Solely interacts with Prisma ORM. No business logic here.
- **Domain (`domain/`)**: Zod schemas, TypeScript types, and DTOs.

### 3. API Response Standardization & Global Errors
- Always use `sendResponse` and `sendError` from `utils/response.ts` for consistent JSON format (`ApiResponse<T>`).
- Express 5 handles async errors natively. Wrap controllers in `try-catch` and call `next(error)` for global handling.
- Catch `SentriError` in the global error handler (`src/app/index.ts`) to return standard `ApiResponse`.

### 4. Boilerplate Implementation (Dependency Injection)
All backend modules must follow this exact Dependency Injection pattern:

**A. Domain (`domain/schemas.ts`)**
```typescript
export const userSchema = z.object({ name: z.string() });
export type UserDto = z.infer<typeof userSchema>;
```

**B. Repository (`repository/users.repository.ts`)**
```typescript
export class UserRepository {
  async findAll() { return prisma.user.findMany(); }
}
export const userRepository = new UserRepository(); // Export singleton
```

**C. Service (`service/users.service.ts`)**
```typescript
export class UserService {
  constructor(private repository: UserRepository) {} // Inject repository
  async getAll() { return this.repository.findAll(); }
}
export const userService = new UserService(userRepository); // Export singleton
```

**D. Controller (`controller/users.controller.ts`)**
```typescript
export class UserController {
  constructor(private service: UserService) {} // Inject service
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
      sendResponse(res, 200, 'Berhasil', data);
    } catch (error) {
      next(error);
    }
  };
}
export const userController = new UserController(userService); // Export singleton
```

**E. Router (`route/users.route.ts`)**
```typescript
export const usersRoute = Router();
usersRoute.get('/', userController.getAll);
```

### 5. Webhooks & Shadow Data
- Handle shadow data sync via Webhook routes (`src/modules/webhook/webhook.route.ts`) using API Key auth (`X-Api-Key`).
- Use strict Zod validation on incoming webhook data.
- Implement `upsertFromWebhook(items: WebhookDto[])` in the Service layer.
- Use `prisma.upsert` in the Repository layer to avoid duplication when syncing data from Master API.
