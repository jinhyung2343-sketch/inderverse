-- 053_update_storage_comments_to_supabase.sql
-- 기존 데이터베이스의 저장소 설명을 Supabase Storage 기준으로 갱신한다.

COMMENT ON TABLE episode_images IS '에피소드 이미지. Supabase Storage 경로 저장';
COMMENT ON COLUMN episode_images.is_verified IS '이미지 처리 작업에서 magic bytes 검증 완료 여부';
COMMENT ON COLUMN episode_images.cleanup_status IS 'Supabase Storage 파일 정리 상태. 삭제/교체 후 고아 파일 추적에 사용';
COMMENT ON COLUMN episode_images.original_file_path IS 'Supabase Storage 원본 파일 경로';
COMMENT ON COLUMN episode_images.optimized_file_path IS 'Supabase Storage 독자용 최적화 파일 경로';
COMMENT ON COLUMN episode_images.thumbnail_file_path IS 'Supabase Storage 썸네일 파일 경로';
COMMENT ON TABLE storage_cleanup_jobs IS '업로드 교체/삭제로 더 이상 참조하지 않는 Supabase Storage 파일 정리 대기열. 직접 테이블 접근은 운영자 전용';
COMMENT ON COLUMN storage_cleanup_jobs.file_path IS 'Supabase Storage 파일 경로. 실제 삭제 전 공개 URL 대신 경로 기준으로 처리';
