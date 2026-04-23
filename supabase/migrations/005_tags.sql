-- 005_tags.sql
-- 태그 마스터 + 채널↔태그 다대다 + 성인태그 자동전환 trigger

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category tag_category NOT NULL DEFAULT 'genre',
  is_adult_only BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 채널↔태그 조인 테이블
CREATE TABLE channel_tags (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, tag_id)
);

ALTER TABLE channel_tags ENABLE ROW LEVEL SECURITY;

-- 성인 태그 부착 시 채널 자동 성인 전환 trigger
CREATE OR REPLACE FUNCTION fn_auto_adult_channel()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT is_adult_only FROM tags WHERE id = NEW.tag_id) = TRUE THEN
    UPDATE channels SET is_adult_only = TRUE WHERE id = NEW.channel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_adult_channel
  AFTER INSERT ON channel_tags
  FOR EACH ROW EXECUTE FUNCTION fn_auto_adult_channel();

COMMENT ON TABLE tags IS '태그 마스터 (장르, 분위기, 경고)';
COMMENT ON TABLE channel_tags IS '채널↔태그 다대다 조인 테이블';
