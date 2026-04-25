-- 018_security_hardening.sql
-- 공개 범위 축소, 관리자 예외, 업로드/에피소드 공개 조건 강화

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "age_verify_select" ON age_verifications;
CREATE POLICY "age_verify_select_self" ON age_verifications
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "channels_select" ON channels;
DROP POLICY IF EXISTS "channels_update" ON channels;
DROP POLICY IF EXISTS "channels_delete" ON channels;

CREATE POLICY "channels_select_public" ON channels
  FOR SELECT
  USING (
    status IN ('publishing', 'completed')
    AND (
      is_adult_only = false
      OR EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.is_adult_verified = true
      )
    )
  );

CREATE POLICY "channels_select_owner_admin" ON channels
  FOR SELECT
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "channels_update_owner_admin" ON channels
  FOR UPDATE
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "channels_delete_owner_admin" ON channels
  FOR DELETE
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "episodes_select" ON episodes;
DROP POLICY IF EXISTS "episodes_select_owner" ON episodes;
DROP POLICY IF EXISTS "episodes_update" ON episodes;
DROP POLICY IF EXISTS "episodes_delete" ON episodes;

CREATE POLICY "episodes_select_public" ON episodes
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM channels c
      WHERE c.id = episodes.channel_id
        AND c.status IN ('publishing', 'completed')
    )
    AND (
      is_adult_only = false
      OR EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.is_adult_verified = true
      )
    )
  );

CREATE POLICY "episodes_select_owner_admin" ON episodes
  FOR SELECT
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "episodes_update_owner_admin" ON episodes
  FOR UPDATE
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "episodes_delete_owner_admin" ON episodes
  FOR DELETE
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "images_select" ON episode_images;
DROP POLICY IF EXISTS "images_insert_update_delete" ON episode_images;

CREATE POLICY "images_select_public" ON episode_images
  FOR SELECT
  USING (
    is_verified = true
    AND EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND e.status = 'published'
        AND c.status IN ('publishing', 'completed')
        AND (
          e.is_adult_only = false
          OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.is_adult_verified = true
          )
        )
    )
  );

CREATE POLICY "images_select_owner_admin" ON episode_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "images_insert_owner_admin" ON episode_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "images_update_owner_admin" ON episode_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "images_delete_owner_admin" ON episode_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM episodes e
      JOIN channels c ON c.id = e.channel_id
      WHERE e.id = episode_images.episode_id
        AND c.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "revenue_select_update" ON revenue_settings;
CREATE POLICY "revenue_select_owner_admin" ON revenue_settings
  FOR SELECT
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "revenue_update_owner_admin" ON revenue_settings
  FOR UPDATE
  USING (
    channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "settlements_select" ON settlements;
CREATE POLICY "settlements_select_owner_admin" ON settlements
  FOR SELECT
  USING (
    creator_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );
