import { expect, test } from '@playwright/test'

test.describe('entry and guest navigation', () => {
  test('always opens the start page on first entry', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'inderverse' })).toBeVisible()
    await expect(page.getByRole('link', { name: '시작하기' })).toBeVisible()
    await expect(page.getByText('독립 창작의 주도권을 되찾는 세계')).toBeVisible()

    await page.reload()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: '시작하기' })).toBeVisible()
  })

  test('keeps creator-only channel operations hidden from guests on the hub', async ({ page }) => {
    await page.goto('/main')

    await expect(page.getByText('접속중 - Guest')).toBeVisible()
    await expect(page.getByRole('button', { name: /작품보기/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Spark/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /작가 등록/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: '작가 채널', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '내 채널 운영', exact: true })).toHaveCount(0)
  })

  test('opens settings as a focused page and returns to the hub', async ({ page }) => {
    await page.goto('/main/settings')

    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
    await expect(page.getByRole('link', { name: '허브로 돌아가기' })).toBeVisible()
    await expect(page.getByText('작품보기')).toHaveCount(0)
    await expect(page.getByText('충전하기')).toHaveCount(0)

    await page.getByRole('link', { name: '허브로 돌아가기' }).click()

    await expect(page).toHaveURL('/main')
    await expect(page.getByRole('button', { name: /작품보기/ })).toBeVisible()
  })

  test('redirects protected creator tools to the join prompt for guests', async ({ page }) => {
    await page.goto('/main/studio/creator-channel')

    await expect(page).toHaveURL(/\/join-prompt\?next=%2Fmain%2Fstudio%2Fcreator-channel/)
    await expect(page.getByText('로그인')).toBeVisible()
  })
})
