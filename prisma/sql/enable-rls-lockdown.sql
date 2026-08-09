-- Secure public schema for a Prisma / Better Auth backend on Supabase.
-- Enables RLS on every public table and revokes Data API access from
-- anon / authenticated / PUBLIC. Prisma connects as a privileged role
-- (postgres / bypassrls) so server-side queries keep working.
--
-- Apply with:
--   npm run db:secure-rls

BEGIN;

-- Prevent accidental public object creation in exposed schema
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Lock down existing tables (RLS on + no anon/authenticated grants)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r' -- ordinary tables only
      AND c.relname NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    -- Do NOT FORCE RLS: table owner / bypassrls roles (Prisma) must keep access
    EXECUTE format(
      'REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      r.tablename
    );
  END LOOP;
END $$;

-- Lock down sequences used by serial / identity columns
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS sequencename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC, anon, authenticated',
      r.sequencename
    );
  END LOOP;
END $$;

-- Future tables / sequences created by this role inherit the lockdown
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

-- Explicit sensitive Better Auth tables (password / session token)
-- Keep RLS enabled and ensure no API role can read them.
DO $$
DECLARE
  sensitive text[] := ARRAY['accounts', 'sessions', 'users', 'verifications'];
  t text;
BEGIN
  FOREACH t IN ARRAY sensitive
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
