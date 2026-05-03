-- 026_fixed_creator_share.sql
-- 플랫폼 일반 정산 비율을 작가 70 / 회사 30으로 고정한다.

UPDATE revenue_settings
SET creator_share_pct = 70.00
WHERE creator_share_pct IS DISTINCT FROM 70.00;

ALTER TABLE revenue_settings
  DROP CONSTRAINT IF EXISTS chk_creator_share;

ALTER TABLE revenue_settings
  ADD CONSTRAINT chk_creator_share CHECK (creator_share_pct = 70.00);

ALTER TABLE revenue_settings
  ALTER COLUMN creator_share_pct SET DEFAULT 70.00;

COMMENT ON COLUMN revenue_settings.creator_share_pct IS '플랫폼 일반 정산 기준 작가 몫 70% 고정';
