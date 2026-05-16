-- Give PostgREST enough time to rebuild its schema cache on the hosted project.
-- Request-level timeouts for anon/authenticated remain unchanged.

ALTER ROLE authenticator SET statement_timeout = '30s';

NOTIFY pgrst, 'reload schema';
