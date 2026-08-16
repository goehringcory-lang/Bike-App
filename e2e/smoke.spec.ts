import { expect, test } from '@playwright/test'

// Drops use the deterministic "place" button (same code path as a drop);
// pointer-drag is exercised manually since synthetic drag events are flaky.

test('preset opens on the workbench with all six slots and a passing verdict', async ({ page }) => {
  await page.goto('#/')
  await page.getByTestId('preset-surly-lht-disc-gx11').click()
  await expect(page.getByTestId('bike-diagram')).toBeVisible()
  for (const slot of ['cassette', 'rearDerailleur', 'shifter', 'chain', 'crankset', 'rearHub']) {
    await expect(page.getByTestId(`slot-${slot}`)).toBeVisible()
  }
  await expect(page.getByTestId('verdict-panel').getByTestId('verdict-badge').first()).toHaveAttribute(
    'data-level',
    /certified|verified/,
  )
})

test('placing a Micro Spline cassette on an HG bike goes red with a driver-body explanation', async ({ page }) => {
  await page.goto('#/')
  await page.getByTestId('preset-surly-lht-disc-gx11').click()
  await page.getByTestId('slot-cassette').click() // filter sidebar to cassettes
  await page.getByTestId('place-shimano-cs-m8100-10-51').click()

  await expect(page.getByTestId('verdict-panel').getByTestId('verdict-badge').first()).toHaveAttribute(
    'data-level',
    'incompatible',
  )
  const driverRow = page.locator('[data-rule="cassette-driver"]')
  await expect(driverRow).toHaveAttribute('data-level', 'incompatible')
  await expect(driverRow).toContainText(/Micro Spline driver body/)
  await expect(driverRow).toContainText(/pick a cassette made for your Shimano HG splined driver/)
})

test('a fix button filters the sidebar to compatible alternatives', async ({ page }) => {
  await page.goto('#/')
  await page.getByTestId('preset-surly-lht-disc-gx11').click()
  await page.getByTestId('slot-cassette').click()
  await page.getByTestId('place-shimano-cs-m8100-10-51').click()

  // "show options" on the cassette fix → sidebar shows only HG 12s cassettes
  await page
    .locator('[data-rule="cassette-driver"]')
    .getByRole('button', { name: 'show options' })
    .last()
    .click()
  const sidebar = page.getByTestId('parts-sidebar')
  await expect(sidebar.getByTestId('catalog-part-sram-pg-1230-11-50')).toBeVisible()
  await expect(sidebar.getByTestId('catalog-part-shimano-cs-m7100-10-51')).toHaveCount(0)

  // placing the suggested NX HG cassette resolves the driver problem
  await page.getByTestId('place-sram-pg-1230-11-50').click()
  await expect(page.locator('[data-rule="cassette-driver"]')).toHaveAttribute('data-level', 'certified')
})

test('driver wizard identifies Micro Spline from answers and starts a bike with it', async ({ page }) => {
  await page.goto('#/wizard/driver')
  await page.getByRole('button', { name: '12' }).click()
  await page.getByRole('button', { name: '10 teeth' }).click()
  await page.getByRole('button', { name: /Shimano \(10-51/ }).click()
  await expect(page.getByTestId('wizard-result')).toContainText('Micro Spline')
  await page.getByTestId('wizard-apply').click()
  await expect(page.getByTestId('slot-rearHub')).toContainText('Micro Spline')
})

test('custom part can be added, appears in catalog, and survives reload', async ({ page }) => {
  await page.goto('#/catalog')
  await page.getByTestId('add-custom-part').click()
  await page.getByTestId('field-brand').fill('Sunrace')
  await page.getByTestId('field-model').fill('CSMX80 11-46')
  await page.getByTestId('field-speeds').fill('11')
  await page.getByTestId('field-smallestCog').fill('11')
  await page.getByTestId('field-largestCog').fill('46')
  await page.getByRole('button', { name: 'Save part' }).click()

  await expect(page.getByTestId('catalog-grid')).toContainText('Sunrace')
  await page.reload()
  await expect(page.getByTestId('catalog-grid')).toContainText('Sunrace')
})
