# AI Development Rules

This document defines the rules that AI coding agents (Codex, Cursor, Copilot, etc.) must follow when modifying the Plan2Ponuda codebase.

The goal is to keep the codebase stable, predictable, and maintainable.

AI agents must follow these rules strictly.

---

# 1. General Principles

The codebase must remain:

- simple
- readable
- maintainable
- type-safe

AI agents must avoid unnecessary complexity.

Never introduce technologies that are not explicitly part of the project architecture.

---

# 2. Approved Technology Stack

The project uses the following stack:

Frontend
- Next.js App Router
- React
- TypeScript
- TailwindCSS
- shadcn/ui

Backend
- Next.js Route Handlers
- Server Actions

Database
- Supabase PostgreSQL

ORM
- Prisma

Authentication
- NextAuth / Auth.js (Credentials provider)

Validation
- Zod

Storage
- Supabase Storage

AI integration
- external AI service (future implementation)

---

# 3. Forbidden Technologies

AI agents must NOT introduce the following technologies:

- Clerk
- Firebase
- MongoDB
- Redis
- AWS S3
- GraphQL
- tRPC
- Redux
- Zustand
- complex state management libraries

These technologies are intentionally excluded to keep infrastructure simple.

---

# 4. Code Style Rules

The codebase uses strict TypeScript.

Rules:

- Never use `any`
- Prefer explicit types
- Use interfaces or type aliases
- Avoid implicit any

Example:

Bad:

const data: any

Good:

type ProjectInput = {
  name: string
  areaM2: number
}

---

# 5. Folder Responsibilities

Each folder has a clear responsibility.

AI agents must not mix responsibilities.

---

## src/app

Contains:

- pages
- layouts
- route handlers

Must NOT contain:

- business logic
- database queries

---

## src/server/services

Contains:

- business logic
- calculations
- workflow logic

Example responsibilities:

- project creation
- material calculation
- quote generation

Services may access Prisma.

---

## src/lib/db

Contains:

- Prisma client
- database access helpers

Only this layer should instantiate Prisma.

---

## src/lib/auth

Contains:

- authentication configuration
- password utilities
- session helpers

---

## src/lib/validations

Contains:

Zod schemas.

Used for:

- API input validation
- server actions
- data parsing

---

## src/types

Contains domain types.

Types must align with Prisma models where possible.

---

# 6. API Route Rules

API routes must be thin.

Allowed responsibilities:

- input validation
- calling services
- returning responses

Not allowed:

- large logic blocks
- database queries outside services

Bad example:

route handler doing 100 lines of calculations.

Good example:

route handler calls:

projectService.createProject()

---

# 7. Prisma Usage Rules

Prisma must only be instantiated in:

src/lib/db/prisma.ts

Never instantiate Prisma inside:

- API routes
- services
- React components

Always import the shared Prisma instance.

---

# 8. Authentication Rules

Authentication uses:

NextAuth / Auth.js

Provider:

Credentials (email + password)

Passwords must be:

bcrypt hashed.

User model contains:

passwordHash

Never store plain passwords.

---

# 9. Security Rules

Secrets must never be exposed to the browser.

Server-only variables:

DATABASE_URL  
SUPABASE_SECRET_KEY  
OPENAI_API_KEY  
NEXTAUTH_SECRET  

Client side code may only access:

NEXT_PUBLIC_* variables.

---

# 10. Environment Variables

All environment variables must be validated.

Create a helper:

src/lib/utils/env.ts

AI agents must not directly access process.env throughout the codebase.

Instead import env helpers.

---

# 11. Database Changes

Database schema changes must go through:

Prisma migrations.

Never write raw SQL migrations manually unless explicitly requested.

Command:

npx prisma migrate dev

---

# 12. File Upload Rules

All uploaded files must go to:

Supabase Storage

Bucket:

project-files

Database must store only:

file path  
metadata

Never store binary files in the database.

---

# 13. AI Integration Rules

AI responses must never be trusted blindly.

All responses must:

- be validated
- be parsed
- have fallback logic

AI responses must be stored in the database for debugging.

---

# 14. Logging Rules

Errors should be logged server-side.

Never expose internal errors directly to users.

Return safe error messages.

---

# 15. Testing Mindset

When writing code, AI agents must consider:

- edge cases
- validation errors
- missing data
- malformed requests

Fail safely.

---

# 16. Refactoring Rules

AI agents may refactor code only if:

- it improves readability
- it removes duplication
- it follows architecture rules

Never refactor large parts of the system without explicit instruction.

---

# 17. Performance Rules

Avoid:

- unnecessary database queries
- loading large datasets
- complex loops in route handlers

Use indexes defined in Prisma schema.

---

# 18. Documentation Rules

Whenever AI adds new modules it must include:

clear comments  
function descriptions

Complex logic must be documented.

---

# 19. Dependency Rules

AI agents must not install new npm packages unless absolutely necessary.

Always prefer built-in libraries first.

---

# 20. Definition of Done

A task is considered complete only if:

- TypeScript compiles
- architecture rules are respected
- no forbidden technology is introduced
- code is readable
- no `any` types exist
- security rules are respected

---

# End of Document