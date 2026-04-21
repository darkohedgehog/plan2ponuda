# Plan2Ponuda — Product Requirements Document

## 1. Overview

Plan2Ponuda is a vertical SaaS platform designed for electricians and electrical contractors.

The platform helps professionals generate electrical installation proposals quickly by analyzing floor plans and producing structured project estimates.

Users upload a floor plan (PDF, image, or blueprint), review detected rooms, adjust electrical suggestions, and generate a professional quote including a material list and labor cost.

The goal is to drastically reduce the time needed to prepare installation offers.

---

# 2. Problem Statement

Electrical contractors spend significant time manually analyzing floor plans and calculating materials required for installations.

Typical workflow includes:

- analyzing floor plans
- counting sockets, switches, lights
- estimating cables and materials
- calculating labor
- preparing a customer quote

This process is often:

- manual
- repetitive
- error-prone
- time consuming

Plan2Ponuda automates large parts of this workflow.

---

# 3. Target Users

Primary users:

- independent electricians
- small electrical installation companies
- electrical project estimators
- electrical contractors

User profile:

- technical professionals
- moderate digital skills
- need fast tools
- prefer simple workflows

---

# 4. Core Value Proposition

Plan2Ponuda allows electricians to:

- generate installation estimates in minutes
- reduce manual calculations
- standardize project estimates
- produce professional quotes
- reduce mistakes in material planning

---

# 5. Product Goals

Primary goals:

1. Reduce time required to create installation offers
2. Standardize estimation workflow
3. Improve material planning accuracy
4. Generate professional quotes automatically
5. Create a reusable project workflow

---

# 6. Core Features

## 6.1 Project Management

Users can:

- create new projects
- upload floor plans
- define object type
- define project area

Project fields:

- project name
- client name
- object type
- floor area
- uploaded floor plan

---

## 6.2 Floor Plan Upload

Supported formats:

- PDF
- PNG
- JPG
- JPEG

Files are stored in:

Supabase Storage

The system generates:

- preview image
- normalized floor plan format

---

## 6.3 AI Room Detection (Phase 2)

The system analyzes the floor plan and detects rooms.

Detected properties:

- room name
- room type
- estimated area
- detection confidence

Users can:

- rename rooms
- change room types
- reorder rooms
- remove incorrect rooms
- add missing rooms

---

## 6.4 Electrical Suggestions

Based on room type the system suggests:

- sockets
- switches
- lighting points

Example:

Kitchen:

- 6 sockets
- 2 switches
- 2 lights

Living room:

- 5 sockets
- 2 switches
- 2 lights

Users can manually modify suggestions.

---

## 6.5 Material Calculation

Based on electrical points the system calculates required materials.

Examples:

- cables
- sockets
- switches
- breaker panels
- boxes
- protection equipment

Materials include:

- name
- category
- quantity
- price
- total cost

---

## 6.6 Quote Generation

The system generates a structured quote.

Quote includes:

- client information
- project details
- material list
- labor cost
- total price

Quotes can be exported as:

PDF document

---

# 7. User Workflow

Typical workflow:

1. User signs in
2. User creates project
3. User uploads floor plan
4. AI detects rooms
5. User reviews rooms
6. System suggests electrical points
7. User edits suggestions
8. System generates materials
9. User adjusts materials
10. System generates quote
11. User exports PDF

---

# 8. System Architecture

Frontend:

Next.js (App Router)

Backend:

Next.js Route Handlers

Database:

Supabase PostgreSQL

ORM:

Prisma

Authentication:

NextAuth / Auth.js

Storage:

Supabase Storage

Validation:

Zod

UI:

TailwindCSS  
shadcn/ui

---

# 9. Data Model Overview

Core entities:

User

Project

Room

RoomSuggestion

Material

ProjectMaterial

Analysis

Quote

Relationships:

User → Projects

Project → Rooms

Room → Suggestions

Project → Materials

Project → Quote

---

# 10. Security

Security requirements:

- passwords stored as bcrypt hashes
- secrets stored server-side
- storage buckets private
- API routes protected
- dashboard requires authentication

---

# 11. Non-Goals (v1)

Not included in version 1:

- billing system
- subscriptions
- payment processing
- team collaboration
- multi-tenant organizations
- API access
- mobile app

---

# 12. Future Features

Potential roadmap:

- advanced AI floor plan analysis
- automatic cable routing estimation
- electrical standards validation
- contractor collaboration
- team accounts
- invoice generation
- integration with supplier catalogs
- real material pricing
- CRM integration

---

# 13. Success Metrics

Key product metrics:

- time to generate quote
- number of projects created
- conversion to generated quotes
- user retention
- number of exported quotes

---

# 14. Technical Constraints

The system must:

- avoid vendor lock-in where possible
- keep infrastructure simple
- avoid unnecessary services

Explicit constraints:

- no Redis
- no AWS S3
- no Clerk authentication

---

# 15. MVP Definition

Version 1 must include:

- authentication
- project creation
- floor plan upload
- room editing
- suggestion editing
- material calculation
- quote generation
- PDF export

AI detection can be simplified initially.

---

# End of Document