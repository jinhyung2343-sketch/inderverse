import { TRAFFIC_COST_CACHE_PROFILES } from './traffic-cost-control'

export const PUBLIC_CACHE_REVALIDATE_SECONDS = TRAFFIC_COST_CACHE_PROFILES.publicCatalog.revalidateSeconds

export const PUBLIC_CACHE_TAGS = {
  artworks: 'public-artworks',
  creators: 'public-creators',
  navigation: 'public-navigation',
  sparks: 'public-sparks',
} as const
