# Code Quality Checklist

This document defines the quality checks AI agents must perform before considering a task complete.

AI agents must review their own code against this checklist after implementation.

The goal is to improve consistency, maintainability, and architectural discipline.

---

# 1. General Quality Check

Before finishing a task, confirm:

- the code solves the requested problem
- the code is minimal and not overengineered
- the code is readable
- the code follows the project architecture

---

# 2. Type Safety Check

Confirm:

- no `any` types were introduced
- function inputs are typed
- function outputs are typed
- domain types are clear
- TypeScript remains strict and predictable

If a type is unclear, create an explicit type.

---

# 3. Architecture Check

Confirm:

- UI code stays in UI layer
- business logic stays in service layer
- Prisma usage stays in db layer
- validation stays in validation layer
- no cross-layer mixing exists

Bad example:

database query inside React component

Good example:

component → route/service → Prisma

---

# 4. API Route Check

If the task includes API routes, confirm:

- route is thin
- input is validated
- authentication is checked if needed
- authorization is checked if needed
- route delegates logic to services

Route handlers must not contain large business logic blocks.

---

# 5. Validation Check

Confirm:

- all external input is validated
- Zod is used where appropriate
- required fields are enforced
- invalid data fails safely

Never trust user input.

Never trust AI-generated input.

---

# 6. Security Check

Confirm:

- secrets are server-only
- no secret values are exposed to client code
- protected routes require authentication
- ownership checks are enforced
- safe error messages are returned

Never expose internal stack traces to users.

---

# 7. Prisma Check

If the task includes database logic, confirm:

- Prisma is imported from shared singleton
- no new PrismaClient instances were created
- relations are respected
- writes are authorized
- queries are minimal and reasonable

---

# 8. Environment Variable Check

Confirm:

- env variables are not hardcoded
- client code uses only `NEXT_PUBLIC_*`
- server-only variables are not imported into client components
- env access is centralized when possible

---

# 9. File Upload Check

If the task includes file uploads, confirm:

- file type validation exists
- file size validation exists
- binary data is not stored in database
- files go to Supabase Storage
- file paths only are saved in DB

---

# 10. Error Handling Check

Confirm:

- failure states are handled
- invalid input returns safe messages
- unexpected errors are logged server-side
- UI has at least minimal error feedback

Never swallow errors silently.

---

# 11. UI/UX Check

If the task includes UI, confirm:

- loading states are considered
- empty states are considered
- error states are considered
- forms are understandable
- buttons are clearly labeled

Do not add unnecessary visual complexity.

---

# 12. Naming Check

Confirm:

- file names are clear
- variable names are domain-specific
- function names describe intent
- names match project terminology

Prefer:

createProject  
generateQuote  
saveRoomSuggestions

Avoid vague names like:

handleData  
processThing  
doStuff

---

# 13. Dependency Check

Confirm:

- no unnecessary dependency was added
- built-in solutions were preferred first
- no forbidden technology was introduced

Forbidden examples include:

Clerk  
Redis  
AWS S3  
GraphQL  
tRPC

---

# 14. Performance Check

Confirm:

- no unnecessary queries were added
- no large loops exist in route handlers
- expensive logic is not duplicated
- pages do not fetch more data than needed

---

# 15. Refactor Safety Check

If existing code was changed, confirm:

- existing behavior is preserved
- changes are minimal
- no unrelated files were modified unnecessarily
- refactor improves clarity without changing feature scope

---

# 16. Documentation Check

Confirm:

- complex logic is explained when needed
- TODOs are clear and specific
- placeholders are marked honestly
- unfinished work is documented

Do not pretend partial implementation is complete.

---

# 17. Testing Mindset Check

Before finishing, ask:

- what happens with invalid input?
- what happens if the user is not authenticated?
- what happens if the database fails?
- what happens if the external service fails?
- what happens if the record does not exist?

The code should fail safely.

---

# 18. Completion Check

A task is complete only if:

- code is implemented
- architecture rules are respected
- security rules are respected
- TypeScript remains safe
- no forbidden technologies were introduced
- code is understandable for a human developer

---

# 19. Final Self-Review Output

Before completing a task, AI agents should summarize:

- what was implemented
- which files were changed
- any TODOs left
- any assumptions made
- any manual steps required

This summary must be honest and precise.

---

# End of Document