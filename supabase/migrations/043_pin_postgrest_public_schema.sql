-- Keep Supabase Data API focused on the public schema used by the app.
ALTER ROLE authenticator SET pgrst.db_schemas = 'public';
ALTER ROLE authenticator SET pgrst.db_extra_search_path = 'public, extensions';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
