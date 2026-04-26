export interface ArtworkBackendMapEntry {
  backendChannelId?: string
  episodes?: Record<
    string,
    {
      backendEpisodeId?: string
    }
  >
}

// 실제 Supabase 채널/회차 UUID를 연결할 때는 이 파일만 채우면 됩니다.
// 예시:
// 'night-market': {
//   backendChannelId: '00000000-0000-4000-8000-000000000001',
//   episodes: {
//     'ep-2': {
//       backendEpisodeId: '00000000-0000-4000-8000-000000000011',
//     },
//   },
// },
export const artworkBackendMap: Record<string, ArtworkBackendMapEntry> = {
  'night-market': {
    backendChannelId: '11111111-1111-4111-8111-111111111111',
  },
  'city-rain': {},
  'cold-signal': {},
  'void-parade': {},
  'midnight-letters': {},
  'red-harbor': {},
  'blade-of-mist': {},
  'laugh-track': {},
  'house-of-static': {},
  'gravity-bloom': {},
}
