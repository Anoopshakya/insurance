import { test, expect } from '@playwright/test';
test('desktop navbar stays at the top after scrolling',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/products/motor',{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.scrollTo(0,900));await expect.poll(async()=>Math.round((await page.locator('.website-navbar').boundingBox())!.y)).toBe(0);await expect(page.locator('.website-navbar').getByRole('link',{name:'Become a Partner',exact:true}).filter({visible:true})).toHaveCount(1);
});
test('partner link is visible and fits narrow mobile headers',async({page})=>{
 for(const width of [320,390,430,768]){await page.setViewportSize({width,height:844});await page.goto('/products/motor',{waitUntil:'domcontentloaded'});const link=page.locator('.website-navbar a[aria-label="Become a Partner"]');await expect(link).toBeVisible();await expect(link).toHaveAttribute('href','/partner/register');const box=await link.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);const logo=await page.locator('.website-navbar>a').boundingBox();const actions=await page.locator('.website-nav-actions').boundingBox();expect(actions!.x).toBeGreaterThanOrEqual(logo!.x+logo!.width);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
});
