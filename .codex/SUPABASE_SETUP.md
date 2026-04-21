# Supabase Setup Guide

## 1. Create project
Create a new Supabase project in the dashboard.

## 2. Save these values
- Project URL
- Publishable key
- Secret key
- Database password
- Transaction pooler connection string (recommended for hosted/serverless apps)
- Direct connection string (for migrations)

## 3. Enable products
- Database
- Auth
- Storage

## 4. Auth settings
For this app, Supabase will be used primarily for:
- Postgres database
- Storage
Optional:
- Email delivery infrastructure later, if you switch auth strategy

Because this stack uses NextAuth/Auth.js with credentials, you do NOT need to use Supabase Auth for user login in v1.

## 5. Create storage bucket
Bucket name:
- project-files

Suggested config:
- private bucket
- signed URLs for previews/downloads

## 6. SQL checklist
- Enable pgcrypto if needed
- Create app tables via Prisma migrations
- Do not create duplicate auth tables manually
- Add RLS policies only if using Supabase APIs directly for app tables
- If Prisma is the only DB access layer, RLS can be deferred at first, but add it before scale

## 7. Recommended environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=
DIRECT_URL=

## 8. Connection strategy
Use:
- DATABASE_URL = Supabase transaction pooler for runtime
- DIRECT_URL = direct DB connection for Prisma migrations

## 9. Security rules
- Never expose SUPABASE_SECRET_KEY to the client
- Never put secrets in NEXT_PUBLIC_*
- Use signed upload or server-generated signed URLs
- Validate MIME type and file size server-side

## 10. Suggested first bucket policy model
Keep bucket private and upload through a server-controlled flow.
That is simpler and safer than broad client write permissions.

## 11. Nice-to-have later
- Edge Functions
- cron jobs
- pgvector
- Realtime
