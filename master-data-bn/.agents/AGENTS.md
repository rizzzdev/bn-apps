# Project-Scoped Rules: Master Data BN

This file serves as the project memory for the AI agent.

## Backend (be)
- **Tech Stack**: Express.js, TypeScript, Prisma (adapter-pg), PostgreSQL, Redis (ioredis), sentri (auth), zod.
- **Structure**: Modular structure in `src/modules` (e.g., academic-year, student, teacher).
- **API Base**: Routes are under `/api/v1`. Auth routes under `/api/v1/auth`.

## Frontend (fe)
- **Tech Stack**: SvelteKit 2, Svelte 5, Tailwind CSS v4, Vite.
- **Structure**: Components in `src/lib/components` (atoms, molecules), features in `src/lib/features`.
- **API Interaction**: Uses `fetch` with `PUBLIC_API_URL`. Ensure `credentials: 'include'` is set for auth endpoints to handle sentri's secure cookies.

## Authentication
- **Login**: `POST /api/v1/auth/login` using `{ identifier, password }`. Identifiers: `email`, `nis`, `nip`, `phone`, `nik`, `nisn`.
- `sentriAuth` manages secure cookies.
