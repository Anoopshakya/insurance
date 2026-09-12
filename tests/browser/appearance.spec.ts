import { test, expect } from "@playwright/test";
const routes = ["/", "/contact", "/products/health-insurance", "/products/motor-insurance", "/products/life-insurance", "/partner/login", "/partner/register", "/customer/login", "/customer/register", "/admin/login"];
for (const theme of ["light", "dark"] as const) for (const width of [360, 390, 1440]) {
  test(theme + " controls at " + width + "px", async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({width, height: 900});
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      const inputs = page.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea');
      for (const input of await inputs.all()) {
        if (!await input.isVisible()) continue;
        const styles = await input.evaluate(el => { const s = getComputedStyle(el); return {size:parseFloat(s.fontSize), color:s.color, background:s.backgroundColor}; });
        if (width < 768) expect(styles.size, route).toBeGreaterThanOrEqual(16);
        if (theme === "dark") {
          const rgb = styles.background.match(/\d+/g)!.slice(0,3).map(Number);
          expect(Math.max(...rgb), route + " dark input background").toBeLessThan(100);
          expect(styles.color, route).not.toBe(styles.background);
        }
      }
    }
  });
}
test("saved theme survives navigation and quote dropdown works on mobile", async ({page}) => {
  await page.emulateMedia({colorScheme:"light"});
  await page.addInitScript(() => localStorage.setItem("assure-theme","dark"));
  await page.setViewportSize({width:390,height:844});
  await page.goto("/products/health-insurance");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  const form=page.locator("#get-quotation");
  await form.getByLabel("Full name").fill("Theme check");
  await expect(form.getByLabel("Full name")).toHaveValue("Theme check");
  await form.getByLabel("Select product").click();
  await form.locator('[role="option"][data-value="travel"]').click();
  await expect(form.getByLabel("Select product")).toHaveAttribute("data-value","travel");
  await page.screenshot({path:"test-results/theme-mobile-dark.png",fullPage:true});
  await page.goto("/partner/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
});

test("dark cards match their text and quote modal remains usable on mobile", async ({page}) => {
  await page.emulateMedia({colorScheme:"dark"});
  await page.setViewportSize({width:390,height:844});
  for (const [route,selector] of [["/contact",".contact-form-card"],["/products/health-insurance",".health-care-badge"],["/partner/login",".mp-auth-tabs"],["/",".website-navbar"]]) {
    await page.goto(route);
    const surface=page.locator(selector).first();
    await expect(surface).toBeVisible();
    const color=await surface.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(Math.max(...color.match(/\d+/g)!.slice(0,3).map(Number)),selector).toBeLessThan(100);
  }
  await page.getByRole("button",{name:"Get Plan Details"}).first().click();
  const dialog=page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Full name").fill("Mobile theme check");
  await expect(dialog.getByLabel("Full name")).toHaveValue("Mobile theme check");
  await dialog.getByLabel("Select product").click();
  await dialog.locator('[role="option"][data-value="motor"]').click();
  await expect(dialog.getByLabel("Select product")).toHaveAttribute("data-value","motor");
  await dialog.getByRole("button",{name:"Close quotation form"}).click();
  await expect(dialog).not.toBeVisible();
});
