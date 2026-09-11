import { test, expect } from "@playwright/test";
test("contact form validates, preserves failed submissions and confirms saved messages", async ({page,request}) => {
 const invalid=await request.post('/api/public/contact-requests',{data:{}});expect(invalid.status()).toBe(400);
 let attempts=0;let payload:any;
 await page.route('**/api/public/contact-requests',async route=>{payload=route.request().postDataJSON();attempts++;await route.fulfill({status:attempts===1?503:201,contentType:'application/json',body:JSON.stringify(attempts===1?{error:'Please try again.'}:{data:{id:'saved-contact'}})});});
 await page.goto('/contact');const form=page.locator('.contact-form-card form');
 await form.getByRole('button',{name:'Send Message'}).click();await expect(form.getByRole('alert')).toContainText('full name');expect(attempts).toBe(0);
 await form.getByLabel('Full Name').fill('Contact Test');await form.getByLabel('Mobile Number').fill('+91 98765 43210');await form.getByLabel('Email Address').fill('contact@example.com');await form.getByLabel('State',{exact:true}).selectOption('Delhi');await form.getByLabel('Your Message').fill('Please help me understand my policy.');
 await form.getByRole('button',{name:'Send Message'}).click();await expect(form.getByRole('alert')).toContainText('agree');expect(attempts).toBe(0);
 await form.getByRole('checkbox').check();await form.getByRole('button',{name:'Send Message'}).click();await expect(form.getByRole('alert')).toContainText('try again');await expect(form.getByLabel('Full Name')).toHaveValue('Contact Test');
 await form.getByRole('button',{name:'Send Message'}).click();await expect(form.getByRole('status')).toContainText('message has been received');expect(payload.mobile).toBe('9876543210');expect(payload.consent).toBe(true);expect(payload.state).toBe('Delhi');await expect(form.getByLabel('Full Name')).toHaveValue('');
});
test('contact layout fits desktop and mobile with correct contact links',async({page})=>{
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.goto('/contact');await expect(page.locator('h1')).toContainText("We're Here");await expect(page.locator('#get-quotation')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await expect(page.locator('.contact-sidebar a[href="mailto:hello@magikpolicy.com"]')).toBeVisible();await expect(page.locator('.contact-sidebar a[href="tel:+918920028861"]')).toHaveCount(2);await expect(page.locator('body')).not.toContainText('7678438041');await page.screenshot({path:'test-results/contact-'+width+'.png',fullPage:true});}
});
