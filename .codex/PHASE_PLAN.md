# Plan2Ponuda Phase Plan

This document defines the development phases for Plan2Ponuda.

AI agents must use this file to understand implementation order and priorities.

The purpose of this plan is to keep development incremental, stable, and aligned with the product goals.

---

# Phase 0 — Foundation Setup

## Goal

Set up the initial technical foundation of the project.

## Objectives

- establish project structure
- configure Prisma
- connect Supabase
- prepare authentication foundation
- create architecture-safe folders
- configure environment handling

## Deliverables

- base folder structure
- Prisma schema
- Prisma client singleton
- Supabase helpers
- environment helpers
- NextAuth/Auth.js foundation
- sign-in page
- sign-up page
- protected dashboard layout

## Success Criteria

- project runs locally
- Prisma connects successfully
- authentication structure exists
- dashboard route protection works
- no demo/example Prisma schema remains

---

# Phase 1 — Project Management

## Goal

Allow authenticated users to create and manage projects.

## Objectives

- project list page
- create project page
- project detail page
- typed project CRUD flows

## Deliverables

- projects list UI
- new project form
- project details page
- project service
- project Zod schema
- protected API routes or server actions

## Success Criteria

- user can create project
- user can view only own projects
- validation errors are handled safely
- project records persist in database

---

# Phase 2 — File Uploads

## Goal

Allow users to upload floor plans to projects.

## Objectives

- support PDF/JPG/JPEG/PNG
- store files in Supabase Storage
- persist file paths in database
- show uploaded file preview

## Deliverables

- upload UI
- storage helper
- upload route or signed upload flow
- file metadata persistence
- file validation rules

## Success Criteria

- authenticated user can upload a valid file
- invalid file types are rejected
- project stores sourceFilePath
- preview can be rendered later

---

# Phase 3 — Analysis Foundation

## Goal

Prepare the AI analysis pipeline.

## Objectives

- create analysis data flow
- parse and validate structured AI output
- persist analysis records
- support analysis status lifecycle

## Deliverables

- analysis service
- analysis schema
- analysis table usage
- analysis route handler
- placeholder AI integration
- failure-safe analysis pipeline

## Success Criteria

- project can enter analyzing state
- parsed AI result can be saved
- invalid AI output is rejected safely
- failed analysis state is supported

---

# Phase 4 — Room Review Workflow

## Goal

Allow users to review and correct detected rooms.

## Objectives

- show room list
- edit room name
- edit room type
- reorder rooms
- remove rooms
- add missing rooms manually

## Deliverables

- review page
- room editing UI
- room service updates
- room validation schemas

## Success Criteria

- user can fully review room results
- changes persist correctly
- project can transition to reviewed state

---

# Phase 5 — Electrical Suggestions

## Goal

Generate editable electrical suggestions per room.

## Objectives

- define room rules
- generate default sockets/switches/lights
- allow user overrides
- persist suggestion values

## Deliverables

- room-rules.ts
- suggestion generation logic
- suggestion editing UI
- room suggestion persistence

## Success Criteria

- each room gets default suggestions
- user can override values
- overrides persist correctly

---

# Phase 6 — Material Calculation

## Goal

Generate a basic material list from reviewed room suggestions.

## Objectives

- map electrical points to materials
- calculate quantities
- persist project materials
- show material summary

## Deliverables

- material-rules.ts
- project material generation logic
- material table UI
- project materials persistence

## Success Criteria

- project material list is generated
- quantities are stored
- totals can be derived safely

---

# Phase 7 — Quote Generation

## Goal

Generate a full installation quote.

## Objectives

- calculate labor cost
- calculate material cost
- calculate subtotal and total
- save quote snapshot

## Deliverables

- quote service
- quote page
- quote summary UI
- quote persistence

## Success Criteria

- reviewed project can generate quote
- quote values persist correctly
- project can transition to quoted state

---

# Phase 8 — PDF Export

## Goal

Allow users to export a quote as PDF.

## Objectives

- generate PDF document
- include project details
- include room summary
- include material list
- include totals

## Deliverables

- pdf generator
- PDF route or server action
- quote PDF storage or download flow

## Success Criteria

- user can export quote PDF
- output is valid and readable
- PDF reflects latest quote state

---

# Phase 9 — Security Hardening

## Goal

Make the MVP safer for real users.

## Objectives

- protect all private routes
- secure storage access
- ensure ownership checks
- validate all inputs
- harden error handling

## Deliverables

- auth guards everywhere needed
- ownership checks in services
- secure upload validation
- safe error responses
- env validation

## Success Criteria

- users cannot access other users’ data
- invalid requests fail safely
- secrets remain server-only

---

# Phase 10 — Pilot Readiness

## Goal

Prepare the MVP for testing with real electricians.

## Objectives

- improve UX rough edges
- add empty states
- add loading states
- add safe error states
- prepare feedback workflow

## Deliverables

- polished MVP flow
- stable project journey
- basic landing page messaging
- feedback checklist

## Success Criteria

- 3–5 pilot users can complete the main workflow
- product is usable without developer guidance
- core value is demonstrable

---

# Phase 11 — Post-MVP Roadmap

## Goal

Define future expansion after pilot validation.

## Potential Features

- advanced AI room detection
- electrical symbol detection
- cable routing estimation
- real supplier catalog integration
- branded PDF exports
- subscription billing
- team accounts
- organization support
- project sharing
- analytics dashboard

---

# Priority Rules

AI agents must always prioritize:

1. correctness
2. security
3. architecture consistency
4. type safety
5. maintainability
6. speed of implementation

Never skip foundational phases to implement later-stage features prematurely.

---

# Execution Rules

Before implementing a task, AI agents must identify:

- which phase the task belongs to
- whether earlier phases are already completed
- whether the task depends on missing foundations

If prerequisite work is missing, AI must implement prerequisites first.

---

# Definition of Healthy Progress

Progress is considered healthy when:

- features are implemented in phase order
- each phase leaves the project stable
- no architectural shortcuts are introduced
- no forbidden technologies are added

---

# End of Document