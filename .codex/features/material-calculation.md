# Feature: Material Calculation

## Feature Goal

Generate a material list based on electrical suggestions.

---

# User Story

As an electrician,

I want the system to calculate required materials,

So I can estimate installation costs quickly.

---

# Entry Point

Project Workflow

Route:

/dashboard/projects/[projectId]/quote

---

# Material Mapping

Sockets → sockets material  
Switches → switches material  
Lights → lighting material

Cables estimated by room area.

Example:

3x2.5 cable  
3x1.5 cable  
junction boxes  
breaker panels

---

# UI Requirements

Material table:

Material Name  
Category  
Quantity  
Unit Price  
Total Price

User can edit:

Quantity  
Unit Price

---

# Backend Logic

Steps:

1. read room suggestions
2. map suggestions to materials
3. calculate quantities
4. generate project material list

---

# Database

Tables:

Material  
ProjectMaterial

---

# Service Layer

File:

material-rules.ts

Function:

generateProjectMaterials()

---

# Success Result

Material list generated and saved.