# AGENTS.md

## Project
Plan2Ponuda is a vertical SaaS for electricians. Users upload a floor plan, review AI-assisted room analysis, generate material lists, and export quotes.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- Supabase Postgres
- Supabase Storage
- next-auth / Auth.js
- Zod

## Main rules
1. Do not introduce `any` unless explicitly justified.
2. Prefer server components where possible.
3. Keep secrets on the server only.
4. Never expose `SUPABASE_SECRET_KEY` or any provider secret to the client.
5. Validate all external input with Zod.
6. Keep route handlers thin; move logic into services.
7. Prefer composition over giant components.
8. Use explicit loading, empty, and error states.
9. All DB writes must be authorized against the current session user.
10. Avoid unnecessary dependencies.

## Auth rules
- Use Credentials provider for MVP.
- Hash passwords with bcryptjs.
- Use JWT session strategy.
- Protect dashboard routes.
- Never trust client-provided user IDs.

## Database rules
- Prisma is the source of truth for schema.
- Runtime should use pooled DATABASE_URL.
- Migrations should use DIRECT_URL.
- Never run destructive migration commands without explaining impact.

## File upload rules
- Allow only PDF, JPG, JPEG, PNG.
- Validate MIME type and max size on server.
- Store files in a private Supabase Storage bucket.
- Use signed URLs for access when needed.

## AI analysis rules
- AI output must be requested as strict JSON.
- Validate AI JSON with Zod before saving.
- On validation failure, return a recoverable error state.
- Do not market output as final electrical design; it is a user-reviewed proposal.

## UI rules
- Keep forms simple and obvious.
- Use review-first UX after analysis.
- Every project detail page should show:
  - source file preview
  - analysis status
  - room suggestions
  - quote CTA

## Code quality
- Add comments only where logic is non-obvious.
- Prefer small utilities.
- Keep naming domain-specific and clear.
- Add indexes for frequent query paths.
- Preserve type-safety end-to-end.

## Security review checklist
- No secrets in client bundles
- No privileged DB calls from client
- No unauthorized project access
- No unvalidated file uploads
- No unbounded analysis endpoint abuse
