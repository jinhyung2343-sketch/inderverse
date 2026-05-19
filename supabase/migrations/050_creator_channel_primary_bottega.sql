-- 050_creator_channel_primary_bottega.sql
-- Stores the creator's chosen primary Bottega genre after creator registration.

ALTER TABLE creator_channels
  ADD COLUMN IF NOT EXISTS primary_work_type work_type;

COMMENT ON COLUMN creator_channels.primary_work_type IS
  '작가 등록 후 선택한 대표 Bottega 장르. 선택된 장르에 맞는 My Bottega로 바로 진입한다.';

NOTIFY pgrst, 'reload schema';
