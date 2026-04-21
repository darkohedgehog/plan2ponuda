# Feature: Review Rooms

## Feature Goal

Allow users to review and correct rooms detected from the floor plan.

The AI analysis may produce imperfect results, therefore users must be able to adjust the room list manually.

---

# User Story

As an electrician,

I want to review detected rooms,

So I can ensure the electrical estimation is based on correct room data.

---

# Entry Point

Project Page

Route:

/dashboard/projects/[projectId]/review

---

# UI Requirements

Display list of detected rooms.

Each room should show:

Room Name  
Room Type  
Estimated Area  
Confidence score (optional)

Editable fields:

Room Name  
Room Type

Room Type options:

living_room  
bedroom  
kitchen  
bathroom  
hallway  
office  
unknown

---

# User Actions

User can:

Rename room  
Change room type  
Delete room  
Add new room manually  
Reorder rooms

---

# Validation Rules

Room name must:

not be empty  
max length 100

Room type must match enum.

---

# Backend Logic

Steps:

1. Load project rooms
2. Display editable list
3. Save user changes
4. Update Room table
5. Update project status to "reviewed"

---

# Database Operations

Update:

Room

Fields:

name  
type  
sortOrder

Create:

new Room records if user adds rooms.

Delete:

rooms user removes.

---

# Service Layer

Service:

analysis-service.ts

Functions:

getProjectRooms()  
updateRooms()

---

# Security

User must own project.

---

# Success Result

Rooms are saved correctly.

Project status becomes:

reviewed