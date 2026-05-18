-- 048_standardize_artwork_saves_to_channel_uuid.sql
-- Store artwork_saves.artwork_id as the backend channel UUID when a mock public id is mapped.

UPDATE artwork_saves
SET artwork_id = '11111111-1111-4111-8111-111111111111'
WHERE artwork_id = 'night-market';

WITH duplicate_saves AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY user_id, artwork_id
        ORDER BY saved_at ASC, id ASC
      ) AS duplicate_rank
    FROM artwork_saves
  ) ranked
  WHERE duplicate_rank > 1
)
DELETE FROM artwork_saves
WHERE id IN (SELECT id FROM duplicate_saves);

COMMENT ON TABLE artwork_saves IS 'explore 작품 저장 상태. 서버 기반 작품은 backend channel UUID를 artwork_id로 저장한다';
COMMENT ON COLUMN artwork_saves.artwork_id IS '서버 기반 작품은 channels.id UUID, 레거시 목업 전용 작품은 public artwork id';
