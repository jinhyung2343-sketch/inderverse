-- 045_storage_cleanup_jobs_rls.sql
-- 내부 저장소 정리 큐의 직접 테이블 접근을 운영자 전용으로 제한한다.

ALTER TABLE storage_cleanup_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_cleanup_jobs_select_admin" ON storage_cleanup_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

CREATE POLICY "storage_cleanup_jobs_update_admin" ON storage_cleanup_jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

COMMENT ON TABLE storage_cleanup_jobs IS '업로드 교체/삭제로 더 이상 참조하지 않는 Supabase Storage 파일 정리 대기열. 직접 테이블 접근은 운영자 전용';
