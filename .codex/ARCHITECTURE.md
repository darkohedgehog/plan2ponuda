# Plan2Ponuda Architecture

## Overview

Plan2Ponuda is a vertical SaaS application for electricians.

The system allows users to:

- create electrical installation projects
- upload floor plans
- review detected rooms
- generate electrical suggestions
- calculate required materials
- export installation quotes

The application follows a layered architecture to keep responsibilities separated.

---

# High Level Architecture

Client Layer
↓
Next.js App Router (Pages / Layouts)
↓
Route Handlers / Server Actions
↓
Service Layer
↓
Prisma ORM
↓
Supabase PostgreSQL

Additional infrastructure:

Supabase Storage → file storage  
NextAuth/Auth.js → authentication  
AI Service → floor plan analysis

---

# Technology Stack

Frontend

Next.js (App Router)  
React  
TypeScript  
TailwindCSS  
shadcn/ui  

Backend

Next.js Route Handlers  
Server Actions  

Database

Supabase PostgreSQL  

ORM

Prisma  

Authentication

NextAuth / Auth.js  

File Storage

Supabase Storage  

Validation

Zod

---

# Layered Architecture

## 1 UI Layer

Location:

src/app  
src/components

Responsibilities:

- render UI
- collect user input
- call server actions
- call API routes

Rules:

UI must not contain business logic.

---

## 2 Controller Layer

Location:

src/app/api

Responsibilities:

- receive requests
- validate input
- call services
- return responses

Controllers must remain thin.

Example:

api/projects/route.ts

---

## 3 Service Layer

Location:

src/server/services

Responsibilities:

- core business logic
- project creation
- analysis logic
- quote generation
- material calculations

Services may call Prisma.

Services must not access UI code.

---

## 4 Data Access Layer

Location:

src/lib/db

Responsibilities:

- Prisma client
- database access
- data queries

Rules:

Database access must go through Prisma.

---

# Storage Architecture

Floor plans are stored in:

Supabase Storage

Bucket:

project-files

Stored data:

original file  
generated preview  
analysis artifacts

Database stores only:

file path  
metadata

---

# Authentication

Authentication is handled by:

NextAuth / Auth.js

Strategy:

Credentials provider

User fields:

email  
passwordHash  

Sessions:

JWT based

Protected areas:

dashboard  
project pages  
API routes

---

# AI Integration

AI analysis is responsible for:

room detection  
room type classification  
suggested electrical points

AI output must be validated before being written to the database.

AI responses are stored for debugging and auditing.

Table:

Analysis

---

# Project Lifecycle

draft
↓
uploaded
↓
analyzing
↓
reviewed
↓
quoted

Status is stored in:

Project.status

---

# File Upload Flow

User uploads floor plan
↓
File stored in Supabase Storage
↓
Database stores file path
↓
Preview generated
↓
AI analysis triggered

---

# Security Rules

Secrets must never reach the browser.

Server-only secrets:

DATABASE_URL  
SUPABASE_SECRET_KEY  
OPENAI_API_KEY

Authentication required for:

dashboard routes  
project routes  
API routes

---

# Scalability Considerations

System must support:

many projects per user  
large floor plan files  
AI analysis workloads

Design goals:

stateless server  
separate services  
scalable database

---

# Non Goals

The following are intentionally excluded from v1:

billing  
subscriptions  
multi-tenant teams  
API integrations  
mobile apps

---

# Future Architecture Extensions

Planned improvements:

AI rule engine  
material catalog integrations  
supplier price APIs  
team collaboration