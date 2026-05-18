-- 047_dedupe_engagement_and_account_group_constraints.sql
-- Back API-level dedupe with database uniqueness for applause and owner-created groups.

WITH duplicate_spark_reactions AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY channel_id, user_id, reaction_type
        ORDER BY reacted_at ASC, id ASC
      ) AS duplicate_rank
    FROM spark_reactions
    WHERE user_id IS NOT NULL
  ) ranked
  WHERE duplicate_rank > 1
)
DELETE FROM spark_reactions
WHERE id IN (SELECT id FROM duplicate_spark_reactions);

ALTER TABLE spark_reactions
  ADD CONSTRAINT unique_spark_reaction_per_user
  UNIQUE (channel_id, user_id, reaction_type);

WITH duplicate_created_groups AS (
  SELECT id
  FROM (
    SELECT
      ag.id,
      row_number() OVER (
        PARTITION BY ag.created_by_profile_id
        ORDER BY
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM account_group_members agm
              WHERE agm.account_group_id = ag.id
                AND agm.user_id = ag.created_by_profile_id
                AND agm.member_role = 'owner'
                AND agm.status = 'active'
            ) THEN 0
            ELSE 1
          END,
          ag.created_at ASC,
          ag.id ASC
      ) AS duplicate_rank
    FROM account_groups ag
    WHERE ag.created_by_profile_id IS NOT NULL
  ) ranked
  WHERE duplicate_rank > 1
)
UPDATE account_groups
SET created_by_profile_id = NULL
WHERE id IN (SELECT id FROM duplicate_created_groups);

ALTER TABLE account_groups
  ADD CONSTRAINT unique_account_groups_created_by_profile
  UNIQUE (created_by_profile_id);

COMMENT ON CONSTRAINT unique_spark_reaction_per_user ON spark_reactions
IS '한 사용자는 같은 스파크 채널에 같은 반응을 한 번만 남길 수 있다';

COMMENT ON CONSTRAINT unique_account_groups_created_by_profile ON account_groups
IS '한 프로필이 자동 생성 경로에서 여러 책임 그룹을 만들지 않도록 보장한다';
