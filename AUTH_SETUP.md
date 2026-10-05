# RESCRO Portal authentication setup

## Vercel variables

The Neon integration already provides `DATABASE_URL` (and `POSTGRES_URL`) to Production and Preview. Keep those values sensitive.

Add `RESCRO_SETUP_TOKEN` as a sensitive Vercel environment variable for Preview and Production. Use a random secret of at least 32 bytes. The setup page accepts it only while `portal_users` has no rows. After creating the first Admin, remove the variable and redeploy; existing accounts and sessions do not depend on it.

## First Admin

1. Deploy the authentication branch to a Vercel Preview deployment.
2. Visit `/setup` on that preview and create the initial Admin using the setup token.
3. Remove `RESCRO_SETUP_TOKEN`, then redeploy Preview and Production.
4. Sign in through `/login`. The database is shared across preview and production, so do not create test users in a shared production database.

The application creates `portal_users`, `portal_sessions`, and `portal_audit_logs` tables on first use. Passwords use salted scrypt hashes. Browser sessions are opaque random tokens stored only as SHA-256 hashes in the database and delivered through HttpOnly, SameSite cookies.

## Current scope and data boundary

Authentication, user administration, permission checks for portal routes and user-management/audit APIs, session invalidation for disabled accounts, and account-action audit records use Neon. Existing order, production stage, shipping, and stock records are still the current demo/localStorage implementation. They have not been migrated to Neon, and production-stage completion actors cannot be recorded reliably until the production transition itself is backed by a server API. Do not use the current demo order data as a secure source of customer data.
