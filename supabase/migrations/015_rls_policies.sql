-- 015_rls_policies.sql
-- 전 테이블 Row Level Security 가이드 라인

-- (SELECT auth.uid()) 형식 사용하여 성능 저하 방지

-- 1. profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- 2. age_verifications (서버 전용, 읽기는 본인만)
CREATE POLICY "age_verify_select" ON age_verifications FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 3. channels
CREATE POLICY "channels_select" ON channels FOR SELECT USING (
  is_adult_only = false
  OR (SELECT is_adult_verified FROM profiles WHERE id = (SELECT auth.uid())) = true
);
CREATE POLICY "channels_insert" ON channels FOR INSERT WITH CHECK (
  creator_id = (SELECT auth.uid())
  AND (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('creator', 'admin')
);
CREATE POLICY "channels_update" ON channels FOR UPDATE USING (creator_id = (SELECT auth.uid()));
CREATE POLICY "channels_delete" ON channels FOR DELETE USING (creator_id = (SELECT auth.uid()));

-- 4. tags, channel_tags (누구나 조회, 수정은 서버나 관리자/채널주인)
CREATE POLICY "tags_select" ON tags FOR SELECT USING (true);
CREATE POLICY "channel_tags_select" ON channel_tags FOR SELECT USING (true);
CREATE POLICY "channel_tags_insert" ON channel_tags FOR INSERT WITH CHECK (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);
CREATE POLICY "channel_tags_delete" ON channel_tags FOR DELETE USING (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);

-- 5. episodes
CREATE POLICY "episodes_select" ON episodes FOR SELECT USING (
  status = 'published'
  AND (
    is_adult_only = false
    OR (SELECT is_adult_verified FROM profiles WHERE id = (SELECT auth.uid())) = true
  )
);
CREATE POLICY "episodes_select_owner" ON episodes FOR SELECT USING (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);
CREATE POLICY "episodes_insert" ON episodes FOR INSERT WITH CHECK (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);
CREATE POLICY "episodes_update" ON episodes FOR UPDATE USING (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);
CREATE POLICY "episodes_delete" ON episodes FOR DELETE USING (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);

-- 6. episode_images
CREATE POLICY "images_select" ON episode_images FOR SELECT USING (
  episode_id IN (SELECT id FROM episodes)
);
CREATE POLICY "images_insert_update_delete" ON episode_images FOR ALL USING (
  episode_id IN (
    SELECT e.id FROM episodes e JOIN channels c ON e.channel_id = c.id WHERE c.creator_id = (SELECT auth.uid())
  )
);

-- 7. episode_views (본인만 조회, 입력은 서버에서 혹은 로그성 모두 혀용(옵션))
CREATE POLICY "episode_views_insert" ON episode_views FOR INSERT WITH CHECK (true);
CREATE POLICY "episode_views_select" ON episode_views FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 8. coin_wallets / transactions (본인만 조회, 입력은 API 서버에서만 처리하므로 제어불가로 남김 - Service Role)
CREATE POLICY "wallet_select" ON coin_wallets FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "coin_tx_select" ON coin_transactions FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 9. purchases (본인만 조회)
CREATE POLICY "purchases_select" ON purchases FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 10. wait_free_unlocks (본인만 조회)
CREATE POLICY "wait_free_select" ON wait_free_unlocks FOR SELECT USING (user_id = (SELECT auth.uid()));

-- 11. revenue_settings
CREATE POLICY "revenue_select_update" ON revenue_settings FOR ALL USING (
  channel_id IN (SELECT id FROM channels WHERE creator_id = (SELECT auth.uid()))
);

-- 12. settlements (작가 본인만 조회)
CREATE POLICY "settlements_select" ON settlements FOR SELECT USING (creator_id = (SELECT auth.uid()));
