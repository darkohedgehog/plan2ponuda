# Debug Playbook

This document defines how AI agents must debug problems in the Plan2Ponuda codebase.

AI agents must follow this process before attempting any fix.

The goal is to prevent random fixes and ensure systematic debugging.

---

# 1. Debugging Philosophy

When a bug appears:

DO NOT immediately modify code.

First identify:

- the error
- the source of the error
- the layer responsible

Debugging must always be systematic.

---

# 2. Debugging Order

Always investigate issues in this order:

1. Input data
2. Validation layer
3. Route handler
4. Service layer
5. Database layer
6. External services

Never jump directly to code changes.

---

# 3. Error Classification

Identify which type of error occurred.

Categories:

Validation errors  
Authentication errors  
Authorization errors  
Database errors  
Network errors  
External API errors  
Logic errors  

Each category requires a different debugging approach.

---

# 4. Input Validation Checks

If an error occurs in an API route:

Verify:

- request body structure
- required fields
- Zod validation schemas
- correct data types

Common issue:

missing required fields.

---

# 5. Authentication Checks

If a route fails:

Verify:

- user session exists
- authentication middleware works
- next-auth session retrieval works

Never assume the user is authenticated.

---

# 6. Authorization Checks

Ensure the user has permission.

Example:

User must only access their own projects.

Check:

project.userId === session.user.id

If mismatch:

return unauthorized error.

---

# 7. Database Debugging

When a Prisma error occurs:

Check:

- schema alignment
- missing migrations
- incorrect field types
- relation constraints

Commands:

npx prisma validate  
npx prisma generate  
npx prisma migrate dev

Never modify the database manually.

Always use Prisma migrations.

---

# 8. Service Layer Debugging

If the issue is not in the route:

Check the service layer.

Verify:

- correct function inputs
- return values
- edge case handling

Add temporary logs if necessary.

---

# 9. Storage Debugging

For file upload issues:

Verify:

- Supabase bucket exists
- file type validation
- correct upload path
- signed upload logic

Common errors:

invalid bucket name  
file size too large  
invalid MIME type

---

# 10. AI Integration Debugging

AI responses must be treated as unreliable input.

Always verify:

- JSON format
- schema validation
- missing fields

Never trust AI responses blindly.

Always validate output.

---

# 11. Logging Rules

When debugging server logic:

Use structured logs.

Example:

console.error("Project creation failed", error)

Logs must not expose secrets.

---

# 12. Reproduce Before Fix

Before fixing a bug:

Ensure the issue can be reproduced.

Steps:

1. identify exact action causing error
2. replicate locally
3. inspect logs
4. inspect database state

Do not fix bugs that cannot be reproduced.

---

# 13. Minimal Fix Principle

When fixing a bug:

Change the smallest possible amount of code.

Avoid:

large refactors  
rewriting modules  
changing architecture

Fix only the root cause.

---

# 14. Post-Fix Verification

After applying a fix:

Verify:

- the original issue is resolved
- no new errors appear
- TypeScript compiles
- application still runs

---

# 15. Never Do These

AI agents must never:

- delete working code randomly
- introduce new dependencies for debugging
- bypass validation
- disable authentication checks
- suppress errors instead of fixing them

---

# 16. Debugging Tools

Use available tools:

Next.js dev logs  
Prisma logs  
browser console  
network inspector

Inspect data rather than guessing.

---

# 17. Safe Debugging Strategy

Preferred debugging process:

1. reproduce bug
2. identify failing layer
3. inspect inputs
4. inspect outputs
5. locate root cause
6. apply minimal fix

Never skip steps.

---

# 18. Escalation

If the root cause cannot be identified:

Document:

- error message
- stack trace
- failing endpoint
- relevant code

Then request human developer assistance.

---

# End of Document