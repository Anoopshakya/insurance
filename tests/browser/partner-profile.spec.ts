import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
async function mount(page: Page) {
  const css = fs.readFileSync("src/app/partner/partner.css", "utf8");
  await page.route("**/__profile_fixture", route => route.fulfill({ contentType: "text/html", body: `<style>*{box-sizing:border-box}${css}</style><div id="root"></div>` }));
  await page.goto("/__profile_fixture");
  await page.addScriptTag({ path: path.resolve("node_modules/react/umd/react.development.js") });
  await page.addScriptTag({ path: path.resolve("node_modules/react-dom/umd/react-dom.development.js") });
  const source = ts.transpileModule(fs.readFileSync("src/components/partner/partner-profile-form.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  await page.addScriptTag({ content: `const runtime={jsx:(t,p,k)=>React.createElement(t,{...p,key:k}),jsxs:(t,p,k)=>React.createElement(t,{...p,key:k})};const require=n=>n==='react'?React:n==='react/jsx-runtime'?runtime:{accessToken:async()=>'fixture-token'};const exports={};${source};function App(){const [open,setOpen]=React.useState(true);return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>setOpen(true)},'Complete profile'),open&&React.createElement(exports.PartnerProfileModal,{onClose:()=>setOpen(false),onComplete:()=>{window.completed=true;setOpen(false)}}))}ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));` });
}
const personal = { dateOfBirth: "1990-01-01", gender: "female", fatherOrSpouseName: "Test Parent", occupation: "Advisor", addressLine1: "123 Main Road", addressLine2: "Apartment 2", city: "Mumbai", state: "Maharashtra", postalCode: "400001" };
test("wizard saves each step, retains inputs after errors, resumes and completes", async ({ page }) => {
  let step = 1, fail = true;
  const saves: string[] = [];
  await page.route("**/api/partner/onboarding/complete", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { data: { values: step > 1 ? personal : {}, step, identitySaved: step > 2, aadhaarLast4: "9012", status: "pending", kycStatus: "not_started" } } });
    const body = route.request().postData()!;
    expect(route.request().headers().authorization).toBe("Bearer fixture-token");
    if (fail) { fail = false; return route.fulfill({ status: 400, json: { error: "Please retry saving" } }); }
    saves.push(body); step++;
    return route.fulfill({ json: { ok: true } });
  });
  await mount(page);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Step 1 of 3/ })).toBeVisible();
  await expect(page.getByLabel("PAN number", { exact: true })).toBeHidden();
  for (const [name, value] of Object.entries(personal)) {
    const input = page.locator(`[name="${name}"]`);
    if (name === "gender") await input.selectOption(value); else await input.fill(value);
  }
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByRole("alert")).toContainText("Please retry saving");
  await expect(page.getByLabel("Address line 1", { exact: true })).toHaveValue(personal.addressLine1);
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByRole("heading", { name: /Step 2 of 3/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Complete profile", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Step 2 of 3/ })).toBeVisible();
  await page.getByLabel("PAN number", { exact: true }).fill("ABCDE1234F");
  await page.locator('[name="aadhaarNumber"]').fill("1234 5678 9012");
  for (const name of ["panDocument", "aadhaarDocument"]) await page.locator(`[name="${name}"]`).setInputFiles({ name: "identity.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 fixture") });
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByRole("heading", { name: /Step 3 of 3/ })).toBeVisible();
  for (const [name, value] of Object.entries({ accountHolder: "Test Partner", bankName: "Test Bank", branchName: "Mumbai", accountNumber: "1234567890", confirmAccountNumber: "1234567890", ifsc: "HDFC0001234" })) await page.locator(`[name="${name}"]`).fill(value);
  await page.getByRole("button", { name: "Save and complete profile" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(saves).toHaveLength(3);
  expect(saves[0]).toContain('name="addressLine2"');
  expect(saves[0]).not.toContain('name="panNumber"');
  expect(saves[1]).toContain('name="panDocument"');
  expect(saves[2]).toContain('name="accountNumber"');
});
test("mobile modal fits viewport and submitted profiles are read-only", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/partner/onboarding/complete", route => route.fulfill({ json: { data: { values: personal, step: 3, identitySaved: true, aadhaarLast4: "9012", status: "under_review", kycStatus: "submitted" } } }));
  await mount(page);
  await expect(page.getByText("Verification status: submitted")).toBeVisible();
  await expect(page.getByLabel("Address line 1", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save and next" })).toHaveCount(0);
  expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Step 2 of 3/ })).toBeVisible();
});
