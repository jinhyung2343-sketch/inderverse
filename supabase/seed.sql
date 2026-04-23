-- seed.sql
-- 초기 태그 마스터 데이터 

INSERT INTO tags (name, category, is_adult_only) VALUES
  ('로맨스', 'genre', false),
  ('판타지', 'genre', false),
  ('액션', 'genre', false),
  ('일상', 'genre', false),
  ('스릴러', 'genre', false),
  ('공포', 'genre', false),
  ('개그', 'genre', false),
  ('무협', 'genre', false),
  ('드라마', 'genre', false),
  ('스포츠', 'genre', false),
  ('SF', 'genre', false),
  ('19금', 'warning', true),
  ('고어', 'warning', true),
  ('성인로맨스', 'genre', true)
ON CONFLICT (name) DO NOTHING;
