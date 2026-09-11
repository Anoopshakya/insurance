import {test,expect} from '@playwright/test';
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'partner@example.test',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'google',providers:['google']},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const token=()=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test-signature'].join('.');
for(const landing of ['/auth/callback','/','/auth/callback?isolated=1'])test('Google popup completes in parent from '+landing,async({page,context,baseURL})=>{
 if(landing.includes('isolated')) await page.addInitScript(()=>{const open=window.open.bind(window);window.open=((...args:Parameters<typeof window.open>)=>{const popup=open(...args);if(!popup)return popup;return new Proxy(popup,{get(target,key){if(key==='closed')return true;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});}) as typeof window.open;});
 await context.route('**/auth/v1/settings',route=>route.fulfill({json:{external:{google:true}}}));
 await context.route('**/auth/v1/authorize**',async route=>{if(landing.includes('isolated')) await new Promise(resolve=>setTimeout(resolve,3500));expect(new URL(route.request().url()).searchParams.get('redirect_to')).toBe(baseURL+'/auth/callback');return route.fulfill({status:302,headers:{location:baseURL+landing+(landing.includes('?')?'&':'?')+'code=test-google-code'}});});
 await context.route('**/auth/v1/token**',route=>route.fulfill({json:{access_token:token(),refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,user}}));
 await context.route('**/auth/v1/user',route=>route.fulfill({json:user}));
 await context.route('**/api/customer/me',route=>route.fulfill({status:403,json:{error:'forbidden'}}));
 await context.route('**/api/partner/me',route=>route.fulfill({json:{data:{profile_setup_required:false}}}));
 await context.route(baseURL+'/partner',route=>route.fulfill({contentType:'text/html',body:'<h1>Partner dashboard</h1>'}));
 await page.goto('/partner/login',{waitUntil:'domcontentloaded'});
 const popupEvent=page.waitForEvent('popup');await page.getByRole('button',{name:/Google/}).click();const popup=await popupEvent;
 await expect(page).toHaveURL(baseURL+'/partner');await expect.poll(()=>popup.isClosed()).toBe(true);await expect(page.getByRole('heading')).toHaveText('Partner dashboard');
});
test('Google provider rejection closes popup and shows parent error',async({page,context,baseURL})=>{
 await context.route('**/auth/v1/settings',route=>route.fulfill({json:{external:{google:true}}}));
 await context.route('**/auth/v1/authorize**',route=>route.fulfill({status:302,headers:{location:baseURL+'/?error=access_denied&error_description=Google+sign-in+was+denied'}}));
 await page.goto('/partner/login',{waitUntil:'domcontentloaded'});const popupEvent=page.waitForEvent('popup');await page.getByRole('button',{name:/Google/}).click();const popup=await popupEvent;await expect(page.getByText('Google sign-in was denied',{exact:true})).toBeVisible();await expect.poll(()=>popup.isClosed()).toBe(true);await expect(page).toHaveURL(/partner\/login/);
});
