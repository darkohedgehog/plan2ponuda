# CODEX_TASKS.md

## Goal
Build the MVP of Plan2Ponuda.

## Deliverables
1. Auth with email/password
2. Dashboard
3. Project CRUD
4. File upload to Supabase Storage
5. AI analysis endpoint
6. Review/edit room suggestions
7. Material list generation
8. Quote summary
9. PDF export

## Priority order
1. Project scaffold
2. Prisma schema + migration
3. Auth
4. Protected dashboard layout
5. Projects CRUD
6. Upload flow
7. Analysis service
8. Review UI
9. Quote + PDF
10. Production hardening

## Constraints
- Use TypeScript everywhere
- Avoid `any`
- App Router only
- No Clerk
- No Redis
- No AWS S3
- No overengineering
- Keep business logic in services

## Required files early
- auth.ts
- proxy.ts
- src/lib/auth/*
- prisma/schema.prisma
- src/lib/supabase/*
- src/server/services/*
- src/lib/validations/*
- src/app/dashboard/*
- src/app/api/*

## Definition of done
- User can sign up
- User can sign in
- User can create project
- User can upload floor plan
- User can run analysis
- User can edit suggestions
- User can view material list
- User can export quote PDF
