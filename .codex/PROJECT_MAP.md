# Plan2Ponuda Project Map

This document explains the structure of the Plan2Ponuda repository.

AI agents must read this file before implementing features.

The goal is to help AI understand where each type of code belongs.

---

# Root Structure

plan2ponuda/

src/  
prisma/  
public/  
.codex/

---

# src/

Main application source code.

Contains UI, backend logic, and services.

---

# src/app

Next.js App Router entry.

Contains:

- pages
- layouts
- route handlers

Structure example:

src/app/

(auth)  
dashboard  
api  

---

# src/app/(auth)

Authentication pages.

Contains:

sign-in  
sign-up

Responsibilities:

- UI forms
- calling authentication flows

Must NOT contain:

- database logic
- business logic

---

# src/app/dashboard

Protected application area.

Only authenticated users can access this section.

Contains:

dashboard overview  
project management  
project workflow pages

Example:

dashboard/page.tsx

---

# src/app/dashboard/projects

Project management pages.

Contains:

project list  
project creation  
project detail pages

Example pages:

projects/page.tsx  
projects/new/page.tsx  
projects/[projectId]/page.tsx  

---

# src/app/dashboard/projects/[projectId]

Project workflow pages.

Contains:

review page  
quote page

Example:

review/page.tsx  
quote/page.tsx  

---

# src/app/api

Backend API routes.

Responsibilities:

- receive requests
- validate input
- call services
- return responses

Routes must remain thin.

Example:

api/projects/route.ts

---

# src/components

Reusable UI components.

Subfolders:

ui  
dashboard  
projects  
analysis  
quote

These are purely presentational components.

Components must NOT contain database queries.

---

# src/lib

Shared utilities and libraries.

Subfolders:

auth  
db  
supabase  
validations  
utils  
ai  
pdf  
rules

---

# src/lib/auth

Authentication logic.

Contains:

NextAuth configuration  
password utilities  
session helpers

Example files:

auth.ts  
password.ts  
session.ts  

---

# src/lib/db

Database access.

Contains:

Prisma client singleton.

File:

prisma.ts

This is the ONLY place where PrismaClient should be instantiated.

---

# src/lib/supabase

Supabase clients.

Contains:

server-client.ts  
client.ts  

Used for:

file uploads  
storage operations

---

# src/lib/validations

Zod validation schemas.

Examples:

project.schema.ts  
analysis.schema.ts  
room.schema.ts  

Used by:

API routes  
server actions  
services

---

# src/lib/utils

General utilities.

Examples:

env.ts  
helpers.ts  

Purpose:

shared helper logic.

---

# src/lib/ai

AI integration logic.

Examples:

analysis-service.ts  

Responsibilities:

- calling AI services
- parsing responses
- returning structured results

AI responses must be validated.

---

# src/lib/rules

Business rule engine.

Examples:

room-rules.ts  
material-rules.ts  

Purpose:

determine suggested sockets  
determine lighting points  
calculate materials

---

# src/lib/pdf

PDF generation logic.

Example:

generate-quote.ts

Purpose:

generate final quote documents.

---

# src/server

Server-only logic.

Subfolders:

services

---

# src/server/services

Business logic layer.

Examples:

project-service.ts  
analysis-service.ts  
quote-service.ts  

Responsibilities:

- project workflows
- calculations
- orchestration logic

Services may access Prisma.

Services must not contain UI code.

---

# src/types

Domain types.

Examples:

project.ts  
analysis.ts  
room.ts  
quote.ts  

Types should match Prisma models where possible.

---

# prisma/

Prisma ORM configuration.

Contains:

schema.prisma  
migrations/  
seed.ts  

Purpose:

database schema definition.

All database changes must go through Prisma migrations.

---

# public/

Static assets.

Examples:

logos  
icons  
images

Files here are public.

---

# .codex/

AI development documentation.

Contains:

PRD.md  
ARCHITECTURE.md  
DATABASE.md  
AI_RULES.md  
PROJECT_MAP.md  
AGENTS.md  
CODEX_TASKS.md  

These files help AI understand the project.

AI agents must read these files before implementing features.

---

# Key Architectural Principles

1. UI must not contain business logic.

2. API routes must remain thin.

3. Services contain business logic.

4. Prisma is the only database access layer.

5. Storage operations use Supabase.

6. Validation uses Zod.

7. Authentication uses NextAuth.

---

# Where New Code Should Go

If AI creates new code:

UI → src/components  
Pages → src/app  
API routes → src/app/api  
Business logic → src/server/services  
Validation → src/lib/validations  
Database access → src/lib/db  
Utilities → src/lib/utils  

Never mix layers.

---

# Common Mistakes AI Must Avoid

Creating database queries inside components  
Creating business logic inside API routes  
Instantiating Prisma multiple times  
Adding random dependencies  
Using `any` type  

---

# Definition of Correct Structure

If a new feature is implemented correctly:

UI → Components  
Route → API route  
Logic → Service  
Database → Prisma  

Layer separation must be preserved.

---

# End of Document