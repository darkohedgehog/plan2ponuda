# Feature: Create Project

## Feature Goal

Allow authenticated users to create a new electrical installation project.

The project acts as the container for all workflow steps:

- floor plan upload
- room detection
- electrical suggestions
- material calculation
- quote generation

---

# User Story

As an electrician,

I want to create a new project,

So that I can estimate electrical installations for a client.

---

# Entry Point

Dashboard → Projects → "New Project"

Route:

/dashboard/projects/new

---

# UI Requirements

The page must contain a form with the following fields:

Project Name  
Client Name  
Object Type  
Area (m²)

Object Type options:

- apartment
- house
- office

Buttons:

Create Project  
Cancel

---

# Validation Rules

Project Name

required  
minimum length: 3

Client Name

optional

Area

required  
must be numeric  
must be greater than 0

Object Type

must be one of:

apartment  
house  
office

---

# Backend Logic

1. Validate form input using Zod.
2. Verify user session.
3. Create project in database.
4. Set project status to "draft".
5. Associate project with authenticated user.

---

# Database Changes

Insert record into Project table.

Fields:

id  
userId  
name  
clientName  
objectType  
areaM2  
status  
createdAt  

Default values:

status = draft

---

# API Route

POST /api/projects

Input:
{
name: string
clientName?: string
objectType: “apartment” | “house” | “office”
areaM2: number
}

Output:
{
projectId: string
}
---

# Service Layer

Service:

project-service.ts

Function:

createProject()

Responsibilities:

- validate data
- create project
- return project

---

# Security Requirements

User must be authenticated.

User must only create projects under their own account.

---

# Error Handling

Possible errors:

Invalid input  
User not authenticated  
Database error

Return safe error messages.

---

# Edge Cases

User submits empty form  
Area is extremely large  
Duplicate submit request

---

# Success Result

Project is created successfully.

User is redirected to:

/dashboard/projects/[projectId]

---

# Future Improvements

Allow floor plan upload directly during project creation.

Allow default templates for projects.
