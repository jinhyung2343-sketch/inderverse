export const INDERIUM_UNIT_PRICE_KRW = 100

export type SubscriptionPlanId = 'basic_monthly' | 'supporter_monthly' | 'basic_annual'
export type SubscriptionBillingPeriod = 'monthly' | 'annual'

export type SubscriptionPlan = {
  id: SubscriptionPlanId
  name: string
  priceKrw: number
  billingPeriod: SubscriptionBillingPeriod
  description: string
  highlights: string[]
  recommended?: boolean
}

export type InderiumChargeOption = {
  amountKrw: number
  label: string
  note: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: '인더버스 구독',
    priceKrw: 7900,
    billingPeriod: 'monthly',
    description: '맛보기 이후 구독 공개 회차를 이어보는 기본 이용권입니다.',
    highlights: ['구독 공개 회차 열람', '무료/맛보기 회차 전체 접근', '인더륨 개별 구매 병행'],
    recommended: true,
  },
  {
    id: 'supporter_monthly',
    name: '서포터 구독',
    priceKrw: 9900,
    billingPeriod: 'monthly',
    description: '기본 구독에 작가 후원 흐름을 더한 고관여 독자용 플랜입니다.',
    highlights: ['구독 공개 회차 열람', '서포터 표시 예정', '월간 후원 혜택 확장 예정'],
  },
  {
    id: 'basic_annual',
    name: '연간 구독',
    priceKrw: 79000,
    billingPeriod: 'annual',
    description: '월 구독보다 낮은 실질 단가로 길게 이용하는 플랜입니다.',
    highlights: ['기본 구독 12개월', '약 2개월 할인 기준', '장기 이용자용'],
  },
]

export const INDERIUM_CHARGE_OPTIONS: InderiumChargeOption[] = [
  { amountKrw: 3000, label: '가벼운 소장', note: '관심 회차를 개별 구매해 보는 단위입니다.' },
  { amountKrw: 10000, label: '기본 충전', note: '소장과 후원을 함께 테스트하기 좋은 단위입니다.' },
  { amountKrw: 30000, label: '팬심 충전', note: '좋아하는 작가에게 후원까지 보내기 좋은 단위입니다.' },
]

export function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatInderium(value: number) {
  return `${value.toLocaleString('ko-KR')} 인더륨`
}

export function getInderiumAmountFromKrw(amountKrw: number) {
  return Math.floor(amountKrw / INDERIUM_UNIT_PRICE_KRW)
}

export function getSubscriptionPlan(planId: string | null | undefined) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null
}
