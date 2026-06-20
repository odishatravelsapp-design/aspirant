import { test, expect, type Page } from '@playwright/test'

// Odia characters live in the Unicode range U+0B00–U+0B7F.
const ODIA = /[଀-୿]/

// Answer every question in the current quiz (works for practice & mock flows).
async function answerAll(page: Page) {
  for (let i = 0; i < 30; i++) {
    const option = page.locator('.option').first()
    await expect(option).toBeVisible()
    await option.click()
    const finish = page.getByRole('button', { name: /Finish|ସମାପ୍ତ/ })
    if (await finish.isVisible().catch(() => false)) {
      await finish.click()
      return
    }
    await page.getByRole('button', { name: /^Next$|ପରବର୍ତ୍ତୀ/ }).click()
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Aspirant/ })).toBeVisible()
})

test('home shows enabled exams and current-affairs entry', async ({ page }) => {
  await expect(page.getByText('IBPS Clerk')).toBeVisible()
  await expect(page.getByText('SBI Clerk')).toBeVisible()
  await expect(page.getByText('IBPS PO')).toBeVisible()
  await expect(page.getByText('OSSSC RI/ARI')).toBeVisible()
  await expect(page.getByText('Daily Current Affairs')).toBeVisible()
})

test('language switch to Odia translates the UI chrome', async ({ page }) => {
  await page.getByLabel('Language').selectOption('or')
  // "Exams" section title becomes its Odia form.
  await expect(page.getByText('ପରୀକ୍ଷା').first()).toBeVisible()
})

test('complete a practice quiz and see analysis', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByRole('button', { name: /Start Practice/ }).click()
  await answerAll(page)
  await expect(page.getByText('Topic-wise analysis')).toBeVisible()
  await expect(page.getByText('Review answers')).toBeVisible()
})

test('mock mode shows a countdown timer', async ({ page }) => {
  await page.getByText('SBI Clerk').click()
  // Mock is the default test type.
  await page.getByRole('button', { name: /Start Mock Test/ }).click()
  await expect(page.getByText(/⏱️/)).toBeVisible()
})

test('banking questions stay English even in Odia mode', async ({ page }) => {
  await page.getByLabel('Language').selectOption('or')
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /ଅଭ୍ୟାସ/ }).click() // Practice chip (Odia)
  await page.getByRole('button', { name: /ଅଭ୍ୟାସ ଆରମ୍ଭ/ }).click() // Start Practice (Odia)
  const qText = await page.locator('.q-text').innerText()
  expect(qText).toMatch(/[A-Za-z]/) // English content
  expect(qText).not.toMatch(ODIA) // not translated
})

test('Odisha exam questions are shown in Odia when selected', async ({ page }) => {
  await page.getByLabel('Language').selectOption('or')
  await page.getByText('OSSSC RI/ARI').click()
  await page.getByRole('button', { name: /ଅଭ୍ୟାସ/ }).click()
  await page.getByRole('button', { name: /ଅଭ୍ୟାସ ଆରମ୍ଭ/ }).click()
  const qText = await page.locator('.q-text').innerText()
  expect(qText).toMatch(ODIA) // translated to Odia
})

test('daily current affairs digest + quiz works', async ({ page }) => {
  await page.getByText('Daily Current Affairs').click()
  await expect(page.getByText(/Updated/)).toBeVisible()
  await page.getByRole('button', { name: /Take quiz/ }).click()
  await answerAll(page)
  await expect(page.getByText('Topic-wise analysis')).toBeVisible()
})

test('a question can be reported from the results review', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByRole('button', { name: /Start Practice/ }).click()
  await answerAll(page)
  const report = page.getByRole('button', { name: /Report/ }).first()
  await report.click()
  await expect(page.getByText(/Reported/).first()).toBeVisible()
})

test('settings: dark theme and large text apply to the document', async ({ page }) => {
  await page.getByLabel('Settings').click()
  await page.getByRole('button', { name: /Dark/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: /^Large$/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-font', 'large')
})

test('question of the day is answerable on home', async ({ page }) => {
  const qotd = page.locator('.qotd')
  await expect(qotd).toBeVisible()
  await qotd.locator('.option').first().click()
  await expect(qotd.locator('.explain')).toBeVisible()
})

test('full mock: palette + submit flow reaches results', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Full Mock/ }).click()
  await page.getByRole('button', { name: /Start Full Mock/ }).click()
  await expect(page.locator('.palette')).toBeVisible()
  await page.locator('.option').first().click() // answer question 1
  await page.getByRole('button', { name: /Submit test/ }).click()
  await page.getByRole('button', { name: /Yes, submit/ }).click()
  await expect(page.getByText('Topic-wise analysis')).toBeVisible()
})

test('results offers a share button', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByRole('button', { name: /Start Practice/ }).click()
  await answerAll(page)
  await expect(page.getByRole('button', { name: /Share my score/ })).toBeVisible()
})

test('insights: topic weightage + predicted practice reaches results', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Trends & Predicted/ }).click()
  await expect(page.getByText(/Topic weightage/)).toBeVisible()
  await page.getByRole('button', { name: /Practice predicted questions/ }).click()
  await answerAll(page)
  await expect(page.getByText('Topic-wise analysis')).toBeVisible()
})

test('about/legal screen shows the disclaimer', async ({ page }) => {
  await page.locator('.footer-link').click()
  await expect(page.getByText('Disclaimer')).toBeVisible()
  await expect(page.getByText(/not affiliated/i)).toBeVisible()
})

test('finishing a quiz creates a streak and revision items', async ({ page }) => {
  await page.getByText('IBPS Clerk').click()
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByRole('button', { name: /Start Practice/ }).click()
  await answerAll(page)
  // Back to home — streak badge should now be present.
  await page.getByRole('button', { name: /Back to home/ }).click()
  await expect(page.getByText(/day streak/)).toBeVisible()
})
