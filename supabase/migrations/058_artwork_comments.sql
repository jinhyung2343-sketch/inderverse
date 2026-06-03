-- 058_artwork_comments.sql
-- 작품 상세 페이지의 공개 댓글을 저장한다.

CREATE TABLE IF NOT EXISTS artwork_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT artwork_comments_body_length CHECK (
    char_length(trim(body)) BETWEEN 1 AND 500
  )
);

CREATE INDEX IF NOT EXISTS artwork_comments_channel_created_idx
  ON artwork_comments (channel_id, created_at DESC)
  WHERE status = 'visible';

CREATE INDEX IF NOT EXISTS artwork_comments_user_created_idx
  ON artwork_comments (user_id, created_at DESC);

ALTER TABLE artwork_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible comments are publicly readable" ON artwork_comments;
CREATE POLICY "Visible comments are publicly readable"
  ON artwork_comments
  FOR SELECT
  USING (status = 'visible');

DROP POLICY IF EXISTS "Authenticated users can comment on open channels" ON artwork_comments;
CREATE POLICY "Authenticated users can comment on open channels"
  ON artwork_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'visible'
    AND EXISTS (
      SELECT 1
      FROM channels
      WHERE channels.id = artwork_comments.channel_id
        AND channels.is_comment_enabled = TRUE
        AND channels.status IN ('publishing', 'completed')
    )
  );

DROP POLICY IF EXISTS "Comment authors can hide their comments" ON artwork_comments;
CREATE POLICY "Comment authors can hide their comments"
  ON artwork_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('hidden', 'deleted'));

COMMENT ON TABLE artwork_comments IS '작품 상세 페이지 공개 댓글';
COMMENT ON COLUMN artwork_comments.channel_id IS '댓글이 달린 작품 채널';
COMMENT ON COLUMN artwork_comments.user_id IS '댓글 작성자 프로필';
COMMENT ON COLUMN artwork_comments.body IS '댓글 본문. 1자 이상 500자 이하';
COMMENT ON COLUMN artwork_comments.status IS '댓글 노출 상태';

NOTIFY pgrst, 'reload schema';
