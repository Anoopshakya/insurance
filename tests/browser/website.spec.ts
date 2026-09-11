import { test, expect } from "@playwright/test";
import { products, hasQuotationForm } from "../../src/components/website/website-products";
import { informationPages } from "../../src/components/website/static-pages";

test("footer pages exist and quotation forms appear only on the seven selected products",async({page,request})=>{
 await page.goto("/about");
 const links=await page.locator(".mp-footer nav a").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")!));
 for(const href of new Set(links)){const response=await request.get(href);expect(response.status(),href).toBe(200);expect((await response.text()).includes('id="get-quotation"'),href).toBe(hasQuotationForm(href));}
 for(const product of products)for(const slug of [product.slug,...product.aliases]){const href="/products/"+slug;const response=await request.get(href);expect(response.status(),slug).toBe(200);expect((await response.text()).includes('id="get-quotation"'),href).toBe(hasQuotationForm(href));}
 for(const info of informationPages){const response=await request.get("/"+info.slug);expect(response.status(),info.slug).toBe(200);expect(await response.text(),info.slug).not.toContain('id="get-quotation"');}
 expect((await request.get("/products/not-a-product")).status()).toBe(404);
 expect((await request.get("/not-a-real-page")).status()).toBe(404);
 await expect(page.locator("#get-quotation")).toHaveCount(0);
});
test("product detection follows navigation and remains editable",async({page})=>{
 await page.goto("/products/health");const form=page.locator("#get-quotation");await expect(form.getByLabel("Select product")).toHaveAttribute("data-value","health");
 await form.getByLabel("Select product").click();await form.locator('[role="option"][data-value="travel"]').click();await expect(form.getByLabel("Select product")).toHaveAttribute("data-value","travel");
 await page.locator('.mp-footer a[href="/products/car-insurance"]').click();await expect(form.getByLabel("Select product")).toHaveAttribute("data-value","car");
 await page.locator('.mp-footer a[href="/about"]').click();await expect(form).toHaveCount(0);
});
test("quotation sends validated contact data and page context then confirms a saved request",async({page})=>{
 let payload:any;await page.route("**/api/public/quote-requests",async route=>{payload=route.request().postDataJSON();await route.fulfill({status:201,contentType:"application/json",body:JSON.stringify({data:{id:"12345678-1234-1234-1234-123456789012"}})});});
 await page.goto("/products/travel-insurance");const form=page.locator("#get-quotation");await form.getByLabel("Full name").fill("Website Test");await form.getByLabel("Contact Number").fill("12345");await form.getByRole("button",{name:"Get Quote",exact:true}).click();await expect(form.getByRole("alert")).toContainText("valid");expect(payload).toBeUndefined();
 await form.getByLabel("Contact Number").fill("+91 98765 43210");await form.getByRole("button",{name:"Get Quote",exact:true}).click();await expect(form.getByRole("status")).toContainText("Your request is with us");expect(payload.productType).toBe("travel");expect(payload.mobile).toBe("9876543210");expect(payload.sourcePath).toBe("/products/travel-insurance");
});
test("failed submissions retain details and can be retried",async({page})=>{
 let attempts=0;await page.route("**/api/public/quote-requests",route=>{attempts++;return route.fulfill({status:attempts===1?500:201,contentType:"application/json",body:JSON.stringify(attempts===1?{error:"Please try again."}:{data:{id:"saved-request"}})});});
 await page.goto("/products/family-insurance");const form=page.locator("#get-quotation");await form.getByLabel("Full name").fill("Website Test");await form.getByLabel("Contact Number").fill("9876543210");await form.getByLabel("Select product").click();await form.locator('[role="option"][data-value="family"]').click();await form.getByRole("button",{name:"Get Quote",exact:true}).click();await expect(form.getByRole("alert")).toContainText("try again");await expect(form.getByLabel("Full name")).toHaveValue("Website Test");await expect(form.getByRole("status")).toHaveCount(0);await form.getByRole("button",{name:"Get Quote",exact:true}).click();await expect(form.getByRole("status")).toContainText("Your request is with us");
});
test("mobile page and quotation form fit the viewport",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/products/family-insurance");await page.locator("#get-quotation").scrollIntoViewIfNeeded();const box=await page.locator("#get-quotation").boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);await expect(page.locator("#get-quotation").getByLabel("Select product")).toHaveAttribute("data-value","family");await page.screenshot({path:"test-results/quotation-mobile.png",fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto("/about");await page.screenshot({path:"test-results/about-desktop.png",fullPage:true});
});

test("quote sidebar sits beside content and submits optional email",async({page})=>{
 await page.setViewportSize({width:1440,height:1000});let payload:any;
 await page.route('**/api/public/quote-requests',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({data:{id:'quote-email'}})});});
 await page.goto('/products/health-insurance');const form=page.locator('#get-quotation');await expect(form).toHaveCount(1);await expect(form.getByRole('heading')).toHaveText('Get Your Health Insurance Quote');
 const content=await page.locator('.health-hero').boundingBox();const box=await form.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(content!.x+content!.width);await page.screenshot({path:'test-results/quotation-sidebar-desktop.png',fullPage:true});
 await form.getByLabel('Full name').fill('Quote Test');await form.getByLabel('Contact Number').fill('9876543210');await form.getByLabel('Email Address').fill('invalid');await form.getByRole('button',{name:'Get Quote',exact:true}).click();await expect(form.getByRole('alert')).toContainText('valid email');expect(payload).toBeUndefined();
 await form.getByLabel('Email Address').fill('quote@example.com');await form.getByRole('button',{name:'Get Quote',exact:true}).click();await expect(form.getByRole('status')).toContainText('Your request is with us');expect(payload.email).toBe('quote@example.com');
});
