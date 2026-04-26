-- 021_spark_work_type.sql
-- channels를 작품 루트(work)로 유지하면서 Spark 타입을 수용한다.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_type') THEN
    CREATE TYPE work_type AS ENUM ('webtoon', 'spark');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spark_format') THEN
    CREATE TYPE spark_format AS ENUM ('single_cut', 'four_cut');
  END IF;
END
$$;

ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS work_type work_type NOT NULL DEFAULT 'webtoon',
  ADD COLUMN IF NOT EXISTS spark_format spark_format,
  ADD COLUMN IF NOT EXISTS spark_panel_count INT,
  ADD COLUMN IF NOT EXISTS spark_caption TEXT,
  ADD COLUMN IF NOT EXISTS spark_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_channels_spark_panel_count'
  ) THEN
    ALTER TABLE channels
      ADD CONSTRAINT chk_channels_spark_panel_count
      CHECK (
        spark_panel_count IS NULL
        OR spark_panel_count IN (1, 4)
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_channels_work_type ON channels(work_type);

COMMENT ON COLUMN channels.work_type IS 'webtoon=연재형 웹툰, spark=단독컷/4컷 중심의 숏폼 만평';
COMMENT ON COLUMN channels.spark_format IS 'single_cut=단독 컷, four_cut=4컷 스트립';
COMMENT ON COLUMN channels.spark_panel_count IS 'Spark 컷 수. 현재는 1 또는 4만 허용';
COMMENT ON COLUMN channels.spark_caption IS 'Spark 카드 하단의 한 줄 카피 또는 설명';
COMMENT ON COLUMN channels.spark_meta IS 'Spark 전용 메타데이터(JSON). 주제, 풍자 톤, 외부 링크 등을 확장 가능하게 보관';
