# Auth Decision — NextAuth/Auth.js vs Clerk

## Recommendation
Use NextAuth/Auth.js instead of Clerk for Plan2Ponuda v1.

## Why this is the better fit
- Fewer moving parts for your current stack
- No external auth UI dependency
- Easier to keep branding/custom UX
- Simpler pricing at early stage
- Works well with Credentials provider for email/password
- Good fit for Vercel + Prisma + Supabase Postgres

## Caveat
The newer Auth.js docs cover `next-auth@5` / `@auth/*`, and the migration docs still describe v5 installation via the beta tag.
Because of that, choose one path and stay consistent:
1. Conservative path: next-auth v4 stable
2. Modern path: next-auth v5 beta / Auth.js style

## My recommendation for you
Go with the conservative production path first:
- `next-auth` stable if you want least risk
- later upgrade to v5 when you want the new `auth()` ergonomics

## Recommended auth model for MVP
- Credentials provider
- email + password
- password hashed with bcryptjs
- users stored in your application DB via Prisma
- JWT session strategy

## Why not Clerk here
Clerk is excellent, but for this product:
- it is one more external dependency
- you do not need advanced org/user management in v1
- custom business auth logic is easier in your own code

## When Clerk would make sense
- team accounts
- organizations
- B2B SSO
- complex multi-tenant permissions
