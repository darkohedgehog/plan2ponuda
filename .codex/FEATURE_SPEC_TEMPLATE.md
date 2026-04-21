# Feature Specification Template

This template defines how new features must be described before implementation.

AI agents must read the specification before writing any code.

Each feature specification must include the following sections.

---

# 1 Feature Name

Short descriptive name of the feature.

Example:

Create Project

---

# 2 Feature Goal

Explain what problem this feature solves.

Example:

Allow users to create a new electrical installation project.

---

# 3 User Story

Describe the feature from the user perspective.

Example:

As an electrician,  
I want to create a new project,  
So I can upload a floor plan and generate an electrical installation estimate.

---

# 4 Entry Points

Where the feature is accessed in the UI.

Example:

Dashboard → Projects → Create Project button.

Route:

/dashboard/projects/new

---

# 5 UI Requirements

Describe the required UI.

Example:

Page contains a form with the following fields:

Project Name  
Client Name  
Object Type  
Floor Area  

Buttons:

Create Project  
Cancel

---

# 6 Validation Rules

Describe input validation.

Example:

Project name

required  
minimum length 3 characters

Area

must be a number  
must be greater than 0

---

# 7 Backend Logic

Describe what must happen on the server.

Example:

1. Validate input using Zod.
2. Verify the user session.
3. Insert a new project in the database.
4. Assign project to authenticated user.

---

# 8 Database Changes

Describe database operations.

Example:

Insert into Project table.

Fields:

name  
clientName  
objectType  
areaM2  
userId  

---

# 9 API Routes

Define backend endpoints.

Example:

POST /api/projects

Input:

project name  
client name  
object type  
area

Output:

created project object

---

# 10 Service Layer

Define service responsibilities.

Example:

project-service.ts

createProject()

Responsibilities:

validate data  
insert database record  
return created project

---

# 11 Security Requirements

Example:

User must be authenticated.

Only the owner can create projects.

---

# 12 Error Handling

Example errors:

Invalid input  
User not authenticated  
Database failure

Return safe error messages.

---

# 13 Edge Cases

Example:

Empty project name  
Very large area value  
User submits form twice

---

# 14 Success Result

Describe expected result.

Example:

Project is created.

User is redirected to:

/dashboard/projects/[projectId]

---

# 15 Future Improvements

Optional section.

Example:

Allow uploading floor plan during project creation.