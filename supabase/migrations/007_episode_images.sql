-- 007_episode_images.sql
-- 에피소드 이미지 (GCS 연동)

CREATE TABLE episode_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL,
  width INT,
  height INT,
  file_size_bytes INT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT unique_episode_sort UNIQUE (episode_id, sort_order)
);

ALTER TABLE episode_images ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE episode_images IS '에피소드 이미지. GCS 경로 저장';
COMMENT ON COLUMN episode_images.is_verified IS 'Cloud Function에서 magic bytes 검증 완료 여부';
