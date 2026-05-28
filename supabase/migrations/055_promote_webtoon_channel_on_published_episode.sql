-- Keep public webtoon discovery in sync with published episodes.

UPDATE public.channels AS c
SET status = 'publishing',
    updated_at = now()
WHERE c.work_type = 'webtoon'
  AND c.status = 'draft'
  AND EXISTS (
    SELECT 1
    FROM public.episodes AS e
    WHERE e.channel_id = c.id
      AND e.status = 'published'
  );

CREATE OR REPLACE FUNCTION public.promote_webtoon_channel_on_published_episode()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    UPDATE public.channels
    SET status = 'publishing',
        updated_at = now()
    WHERE id = NEW.channel_id
      AND work_type = 'webtoon'
      AND status = 'draft';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_webtoon_channel_on_published_episode ON public.episodes;

CREATE TRIGGER trg_promote_webtoon_channel_on_published_episode
AFTER INSERT OR UPDATE OF channel_id, status ON public.episodes
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION public.promote_webtoon_channel_on_published_episode();
