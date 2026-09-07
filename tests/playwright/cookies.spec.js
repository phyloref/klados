/**
 * Curator details persisted as cookies.
 *
 * Klados stores the curator's name, email and ORCID in cookies, but only after
 * the curator has ticked the consent box. Nothing covered this, and the cookie
 * layer is hand-written, so this checks both halves: that consent is required,
 * and that the values survive a reload once given.
 */

const { test, expect } = require('./fixtures/index.js');

test.describe('Curator cookies', () => {
  test('curator details persist only after cookies are allowed', async ({
    mockedPage: page,
  }) => {
    const name = page.locator('#curator-name');
    const allowCookies = page.getByTestId('allow-cookies');

    // Without consent, nothing is stored.
    await expect(allowCookies).not.toBeChecked();
    await name.fill('Ada Lovelace');
    await name.press('Tab');
    await page.reload();
    await expect(page.locator('#curator-name')).toHaveValue('');

    // Give consent, then enter the details.
    await page.getByTestId('allow-cookies').check();
    await page.locator('#curator-name').fill('Ada Lovelace');
    await page.locator('#curator-name').press('Tab');
    await page.locator('#curator-email').fill('ada@example.org');
    await page.locator('#curator-email').press('Tab');

    // They survive a reload. The name contains a space and the address an '@',
    // so this also covers the encoding round-trip.
    await page.reload();
    await expect(page.getByTestId('allow-cookies')).toBeChecked();
    await expect(page.locator('#curator-name')).toHaveValue('Ada Lovelace');
    await expect(page.locator('#curator-email')).toHaveValue('ada@example.org');

    // Withdrawing consent clears them.
    await page.getByTestId('allow-cookies').uncheck();
    await page.reload();
    await expect(page.getByTestId('allow-cookies')).not.toBeChecked();
    await expect(page.locator('#curator-name')).toHaveValue('');
  });
});
