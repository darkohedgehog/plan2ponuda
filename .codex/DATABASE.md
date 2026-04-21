# Plan2Ponuda Database Design

Database is hosted on:

Supabase PostgreSQL

ORM:

Prisma

---

# Core Entities

User  
Project  
Room  
RoomSuggestion  
Material  
ProjectMaterial  
Analysis  
Quote

---

# Entity Overview

## User

Represents an application user.

Fields:

id  
email  
passwordHash  
fullName  
companyName  
createdAt  
updatedAt

Relations:

User → Projects

---

## Project

Represents an electrical installation project.

Fields:

id  
userId  
name  
clientName  
objectType  
areaM2  
status  
sourceFilePath  
previewPath  
createdAt  
updatedAt

Relations:

Project → Rooms  
Project → Materials  
Project → Quote  
Project → Analysis

---

## Room

Represents a detected room in a floor plan.

Fields:

id  
projectId  
name  
type  
estimatedAreaM2  
confidence  
sortOrder

Relations:

Room → RoomSuggestion

---

## RoomSuggestion

Electrical suggestions for a room.

Fields:

suggestedSockets  
suggestedSwitches  
suggestedLights  

User editable fields:

userSockets  
userSwitches  
userLights  

---

## Material

Electrical materials catalog.

Examples:

cables  
switches  
sockets  
breaker panels  

Fields:

name  
unit  
category  
defaultPrice

---

## ProjectMaterial

Materials used in a project.

Fields:

projectId  
materialId  
quantity  
unitPrice  
totalPrice  
source

source can be:

rule  
manual  
ai

---

## Analysis

Stores AI analysis results.

Fields:

provider  
rawResponseJson  
parsedResponseJson  
status  
errorMessage

Purpose:

debugging  
auditing  
improving AI models

---

## Quote

Represents the generated installation quote.

Fields:

laborCost  
materialCost  
subtotal  
total  
pdfPath

One quote per project.

---

# Indexing Strategy

Important indexes:

Project.userId  
Room.projectId  
ProjectMaterial.projectId  
Analysis.projectId

Indexes improve performance for:

dashboard queries  
project loading  
analysis history

---

# Data Integrity

Foreign key constraints:

Project → User  
Room → Project  
RoomSuggestion → Room  
ProjectMaterial → Project  
ProjectMaterial → Material  
Analysis → Project  
Quote → Project

Cascade rules:

Deleting a project deletes:

rooms  
materials  
analysis  
quote

---

# Decimal Fields

Pricing fields use Decimal to avoid floating point issues.

Fields:

unitPrice  
totalPrice  
materialCost  
laborCost  
subtotal  
total

---

# Migration Strategy

Schema changes must go through:

Prisma migrations

Command:

npx prisma migrate dev

Never modify production schema manually.

---

# Seeding Strategy

Initial seed may include:

default electrical materials  
default pricing rules  
room suggestion templates

Seed script:

prisma/seed.ts

---

# Future Database Extensions

Planned tables:

MaterialSupplier  
SupplierPrice  
ProjectHistory  
ProjectShare  
Team