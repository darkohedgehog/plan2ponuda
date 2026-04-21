# Plan2Ponuda — Task Breakdown

## Phase 0 — Setup
- [ ] Create Next.js app (App Router, TypeScript)
- [ ] Install Tailwind, shadcn/ui, Prisma, Zod
- [ ] Create Supabase project
- [ ] Configure env variables
- [ ] Set up GitHub repo
- [ ] Create Vercel project
- [ ] Add ESLint and typecheck scripts

## Phase 1 — Auth
- [ ] Install next-auth
- [ ] Configure Credentials provider
- [ ] Add password hashing with bcryptjs
- [ ] Create auth.ts
- [ ] Add /app/api/auth/[...nextauth]/route.ts
- [ ] Add proxy.ts route protection
- [ ] Add sign-in page
- [ ] Add sign-up flow (custom server action / route)
- [ ] Add logout button
- [ ] Add session helper

## Phase 2 — Database
- [ ] Configure Prisma with Supabase Postgres
- [ ] Add schema.prisma models
- [ ] Run first migration
- [ ] Generate Prisma client
- [ ] Seed starter materials
- [ ] Create indexes
- [ ] Confirm connection pooling strategy

## Phase 3 — Projects
- [ ] Build dashboard page
- [ ] Build projects list page
- [ ] Build create project page
- [ ] Build project detail page
- [ ] Add status badges
- [ ] Add form validation with Zod
- [ ] Add server actions or route handlers for CRUD

## Phase 4 — File Uploads
- [ ] Create Supabase storage bucket
- [ ] Add signed upload flow
- [ ] Support PDF/JPG/PNG
- [ ] Save original file path in DB
- [ ] Render preview
- [ ] Handle upload errors

## Phase 5 — Analysis
- [ ] Build analysis service
- [ ] Convert PDF to image preview
- [ ] Send preview to vision model
- [ ] Enforce structured JSON output
- [ ] Validate AI response with Zod
- [ ] Save raw + parsed analysis
- [ ] Add retry flow
- [ ] Add failed-analysis UI state

## Phase 6 — Rule Engine
- [ ] Add room rules map
- [ ] Generate room suggestions
- [ ] Build editable review form
- [ ] Save user overrides
- [ ] Support add/remove room manually

## Phase 7 — Material List + Quote
- [ ] Create materials table UI
- [ ] Generate project materials from rules
- [ ] Add labor cost formula
- [ ] Add total cost calculator
- [ ] Build quote summary page
- [ ] Generate PDF quote
- [ ] Save quote snapshot

## Phase 8 — Security + Production hardening
- [ ] Add auth guards to every private route
- [ ] Review server/client boundaries
- [ ] Ensure no secret leaks to NEXT_PUBLIC
- [ ] Rate-limit analysis endpoint
- [ ] Add file size/type validation
- [ ] Add logging and error handling
- [ ] Add basic analytics/events
- [ ] Review RLS policies

## Phase 9 — Pilot launch
- [ ] Create landing page copy
- [ ] Add terms/privacy placeholders
- [ ] Invite 3–5 real electricians
- [ ] Collect feedback
- [ ] Improve rule defaults
- [ ] Decide whether to add billing next
