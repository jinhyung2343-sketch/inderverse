-- Force Supabase PostgREST to rebuild its schema cache after production deploys.

NOTIFY pgrst, 'reload schema';
