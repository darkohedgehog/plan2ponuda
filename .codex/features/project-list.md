# Feature: Project List

## Feature Goal

Allow authenticated users to view and manage their existing projects.

The project list acts as the main dashboard entry point for the application.

---

# User Story

As an electrician,

I want to see a list of my projects,

So I can open, manage, and continue working on them.

---

# Entry Point

Dashboard → Projects

Route:

/dashboard/projects

---

# UI Requirements

Page should display:

- list of projects created by the user
- project status
- project client
- project creation date

Each project should be displayed as a card or row.

Fields displayed:

Project Name  
Client Name  
Object Type  
Area (m²)  
Status  
Created Date

---

# Actions

Each project row must include:

Open Project

Optional later:

Delete Project  
Duplicate Project

---

# Empty State

If user has no projects:

Show message:

"No projects yet"

Provide button:

Create your first project

Button links to:

/dashboard/projects/new

---

# Loading State

While projects are loading:

Show loading skeleton or spinner.

---

# Validation Rules

Only projects belonging to the authenticated user must be returned.

---

# Backend Logic

Steps:

1. Verify user session
2. Query projects belonging to user
3. Sort projects by creation date (newest first)
4. Return project list

---

# Database Query

Query:

Project table

Filter:

userId = authenticated user

Order:

createdAt DESC

---

# Service Layer

Service:

project-service.ts

Function:

getUserProjects(userId)

Responsibilities:

query projects  
return structured project list

---

# API Route

GET /api/projects

Response example:
{
projects: [
{
id: “proj_123”,
name: “Apartment Renovation”,
clientName: “John Doe”,
objectType: “apartment”,
areaM2: 80,
status: “draft”,
createdAt: “2025-03-01”
}
]
}
---

# Security Requirements

User must be authenticated.

User must only access their own projects.

---

# Edge Cases

User has zero projects  
Database query returns empty list  
Database connection failure

---

# Success Result

User sees a list of their projects.

User can click a project to open it.

Redirect route:

/dashboard/projects/[projectId]

---

# Future Improvements

Project search  
Project filtering  
Project status filters  
Project duplication