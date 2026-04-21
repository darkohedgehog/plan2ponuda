# Feature: Upload Floor Plan

## Feature Goal

Allow users to upload a floor plan file to a project.

The floor plan is used for room detection and electrical analysis.

---

# User Story

As an electrician,

I want to upload a floor plan for my project,

So the system can analyze the layout and generate electrical suggestions.

---

# Entry Point

Project Page

Route:

/dashboard/projects/[projectId]

Upload component should appear in project overview.

---

# Supported File Types

Allowed formats:

PDF  
PNG  
JPG  
JPEG

---

# File Size Limit

Maximum file size:

10MB

---

# UI Requirements

Upload component should contain:

File upload input  
Drag and drop support (optional)  
Upload button

After upload:

Show uploaded file preview.

---

# Upload Flow

1. User selects file.
2. Client validates file type.
3. Client validates file size.
4. File is uploaded to Supabase Storage.
5. Storage returns file path.
6. File path saved in database.

---

# Storage Location

Supabase Storage

Bucket:

project-files

Folder structure example:

projects/{projectId}/floor-plan.pdf

---

# Database Changes

Update Project record.

Fields updated:

sourceFilePath  
previewPath (optional)

---

# Backend Logic

Steps:

1. Validate user session.
2. Validate project ownership.
3. Generate upload path.
4. Upload file to Supabase Storage.
5. Save file path in Project table.

---

# Service Layer

Service:

project-service.ts

Function:

uploadFloorPlan(projectId, file)

Responsibilities:

validate file  
upload to storage  
update project record

---

# API Route

POST /api/projects/[projectId]/upload

Input:

multipart/form-data

Fields:

file

Output:
{
success: true,
filePath: “projects/project123/floorplan.pdf”
}
---

# Security Requirements

User must be authenticated.

User must own the project.

Reject uploads from unauthorized users.

---

# Validation Rules

Reject files if:

type is unsupported  
file size exceeds limit  
project does not exist  
user does not own project

---

# Edge Cases

Upload interrupted  
File too large  
Invalid MIME type  
Project does not exist

---

# Success Result

Floor plan uploaded successfully.

Project now contains:

sourceFilePath

The file can be used for future analysis.

---

# Future Improvements

Automatic preview generation  
Multiple file uploads  
Version history for floor plans