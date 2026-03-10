import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('mobile layouts apply correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Basic screenshot captures to debug visual regressions
    await page.screenshot({ path: 'mobile_intro.png', clip: { x: 0, y: 0, width: 390, height: 400 } });

    const skillsH2 = await page.locator('h2', { hasText: 'skills & tools' });
    await skillsH2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for potential animations

    await page.screenshot({ path: 'mobile_skills.png', clip: { x: 0, y: 1200, width: 390, height: 600 } });

    console.log("Captured mobile screenshots successfully");
});
