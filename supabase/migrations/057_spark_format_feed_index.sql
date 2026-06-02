-- Keep format-specific Spark feeds on an indexed path.

CREATE INDEX IF NOT EXISTS idx_channels_public_spark_format_feed
  ON public.channels (spark_format, status, is_adult_only, updated_at DESC)
  WHERE work_type = 'spark';

NOTIFY pgrst, 'reload schema';
