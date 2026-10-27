/*
# Add admin_usernames mapping table

## Overview
Allows admin login by username (e.g. "ADMIN") instead of email. A mapping table
associates usernames to auth user IDs. A SECURITY DEFINER function resolves the
username to the email, which the frontend then passes to signInWithPassword.

## New tables
- admin_usernames: maps username (unique, case-insensitive) to auth.users id

## Security
- RLS enabled, no anon/authenticated SELECT policies (table is not directly
  readable by clients).
- A SECURITY DEFINER function `resolve_admin_username(p_username text)` returns
  the email for a given username, callable by anon+authenticated (needed for
  login before a session exists). Only returns active mappings.
*/

CREATE TABLE IF NOT EXISTS public.admin_usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_usernames ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.admin_usernames TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_admin_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.admin_usernames a
  JOIN auth.users u ON u.id = a.user_id
  WHERE lower(a.username) = lower(trim(p_username))
    AND a.is_active = true;
  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_admin_username(text) TO anon, authenticated;

-- Insert the ADMIN username mapping for the existing admin user
INSERT INTO public.admin_usernames (username, user_id, is_active)
SELECT 'ADMIN', id, true FROM auth.users WHERE email = 'admin@genesys-cameroon.com'
ON CONFLICT (username) DO UPDATE SET user_id = EXCLUDED.user_id, is_active = true;