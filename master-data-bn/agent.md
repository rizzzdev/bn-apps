# Master Data BN - Project Documentation & Rules

## Project Overview
This project is a web application (Master Data BN) that consists of two main parts:
- **Backend (be)**: A RESTful API built with Express.js, TypeScript, and Prisma (PostgreSQL).
- **Frontend (fe)**: A web application built with SvelteKit, Vite, and Tailwind CSS v4.

## Backend (be)
### Tech Stack
- **Framework**: Express.js with TypeScript (`tsx` for development).
- **Database**: PostgreSQL via Prisma (`@prisma/client`, `@prisma/adapter-pg`). It uses `pg` and `kysely` internally for some connection pooling logic.
- **Authentication**: Uses `sentri` auth library (`createAuthExpress`). The endpoints are automatically exposed (e.g., `/api/v1/auth/login`).
- **Caching**: Redis via `ioredis`. Caching is implemented via middleware (e.g., `cacheRouteMiddleware`).
- **Validation & File Upload**: Uses `zod` for validation and `multer` for file uploads.
- **Data Export**: Uses `xlsx` for Excel data manipulation.

### Architecture
- **Domain-Driven Modules**: The business logic is organized into modules inside `src/modules` (e.g., `academic-year`, `class`, `dashboard`, `major`, `semester`, `student`, `subject`, `teacher`).
- **Routes**: API routes are mounted on `/api/v1`. Authentication routes are mounted on `/api/v1/auth`.

## Frontend (fe)
### Tech Stack
- **Framework**: SvelteKit 2 (`@sveltejs/kit`) and Svelte 5.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`).
- **Build Tool**: Vite.

### Architecture
- **Components**: UI components are structured inside `src/lib/components` (e.g., atoms, molecules, templates).
- **Features**: Feature-specific components and logic are organized in `src/lib/features` (e.g., `auth`).
- **State Management**: Uses Svelte 5 runes (`$state`, etc.) and stores in `src/lib/stores`.
- **API Calls**: Uses `fetch` to communicate with the backend (`PUBLIC_API_URL` defined in `.env`).

## Auth Flow
- The login form (`src/lib/features/auth/components/login-form.svelte`) sends a `POST` request to `/api/v1/auth/login` with `{ identifier, password }`.
- Valid identifiers on the backend include: `email`, `nis`, `nip`, `phone`, `nik`, `nisn`.
- Secure HttpOnly cookies are used for session/refresh tokens (managed by `sentriAuth`), and `accessToken` may be stored in `localStorage` for client-side API calls. Requests include `credentials: 'include'` to pass cookies.

## Guidelines
- When making modifications, adhere to the domain-driven structure on the backend and feature-based structure on the frontend.
- Utilize the existing `sentri` authentication configuration for securing new endpoints.
- Keep UI components decoupled from features unless they belong to a specific feature module.
