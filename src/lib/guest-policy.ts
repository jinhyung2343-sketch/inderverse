export const LOGIN_REQUIRED_MESSAGE = '이 서비스는 로그인을 해야 가능합니다.'

const guestAllowedMainMenuIds = ['explore', 'spark', 'community', 'library', 'store', 'studio']

export function canGuestOpenMainMenu(menuId: string) {
  return guestAllowedMainMenuIds.includes(menuId)
}
