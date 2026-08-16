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

test('click-to-browse: an empty slot points the parts panel at it, and clicking a part fits it', async ({ page }) => {
  await page.goto('#/')
  await page.getByTestId('preset-surly-lht-disc-gx11').click()
  await page.getByTestId('slot-cassette').getByTitle('Remove part').click()
  await expect(page.getByTestId('slot-cassette')).toContainText('click to browse')

  // A stale search must not survive the slot click, or the panel comes up empty.
  await page.getByPlaceholder('Search parts…').fill('no-such-part')
  await page.getByTestId('slot-cassette').click()

  await expect(page.getByPlaceholder('Search parts…')).toHaveValue('')
  await expect(page.getByTestId('browsing-banner')).toContainText('cassette')
  await expect(page.getByTestId('slot-cassette')).toHaveAttribute('data-browsing', 'true')

  // Clicking the part card itself — not just the small "place" button — fits the part.
  await page.getByTestId('catalog-part-shimano-cs-m5100-11-51').click()
  await expect(page.getByTestId('slot-cassette')).toContainText('CS-M5100-11')
  await expect(page.getByTestId('browsing-banner')).toHaveCount(0)
})

// Dragging needs the part and the slot on screen together; on a phone the parts
// panel stacks ~1000px below the diagram, so tapping is the only way to fit a part.
// `defaultBrowserType` from the device preset can't be set per-describe, so only
// the parts that shape the layout and input model are taken.
const PHONE = { viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true }

test.describe('on a phone', () => {
  test.use(PHONE)

  test('tapping a slot then a part fits it and shows the result', async ({ page }) => {
    const vh = PHONE.viewport.height
    await page.goto('#/')
    await page.getByTestId('preset-surly-lht-disc-gx11').tap()
    await page.getByTestId('slot-cassette').getByTitle('Remove part').tap()

    // touch devices get tap wording, since "drop a part here" is unreachable
    await expect(page.getByTestId('slot-cassette')).toContainText('Tap to browse parts')

    await page.getByTestId('slot-cassette').tap()
    await expect(page.getByTestId('browsing-banner')).toBeVisible()
    // the parts panel must come into view, or the tap looks like it did nothing
    // (polled — the scroll is smooth, so it lands a few frames later)
    await expect(async () => {
      const panel = await page.getByTestId('parts-sidebar').boundingBox()
      expect(panel!.y).toBeLessThan(vh)
      expect(panel!.y + panel!.height).toBeGreaterThan(0)
    }).toPass()

    const card = page.getByTestId('catalog-part-shimano-cs-m5100-11-51')
    await card.scrollIntoViewIfNeeded()
    await card.tap()

    await expect(page.getByTestId('slot-cassette')).toContainText('CS-M5100-11')
    // and the diagram scrolls back so the result is actually visible
    await expect(async () => {
      const slot = await page.getByTestId('slot-cassette').boundingBox()
      expect(slot!.y).toBeGreaterThan(-1)
      expect(slot!.y).toBeLessThan(vh)
    }).toPass()
  })
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
