import {test,expect} from '@playwright/test';
test('health page has original guide, matching hero and one working quote form on both aliases',async({page})=>{
 for(const path of ['/products/health-insurance','/products/health']){
  await page.setViewportSize({width:1440,height:1000});await page.goto(path);await expect(page.getByRole('heading',{level:1})).toContainText('Healthier You');await expect(page.locator('#get-quotation')).toHaveCount(1);await expect(page.getByLabel("Select product")).toHaveAttribute("data-value",'health');
  await expect(page.locator('#health-plans article')).toHaveCount(4);await expect(page.locator('#health-compare article')).toHaveCount(6);await page.getByText('Is cashless treatment completely free?',{exact:true}).click();await expect(page.locator('#health-faq details[open]')).toContainText('co-payments');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
 }
 await page.screenshot({path:'test-results/health-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('/products/health-insurance');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await expect(page.locator('#get-quotation')).toBeVisible();await page.screenshot({path:'test-results/health-mobile.png',fullPage:true});
});
