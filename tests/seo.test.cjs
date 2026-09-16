const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const cache={};function load(file){if(cache[file])return cache[file];const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,URL,require:name=>load(name.replace('@/', 'src/')+'.ts')});return cache[file]=exports;}
const seo=load('src/lib/seo.ts'),{products}=load('src/components/website/website-products.ts'),{informationPages}=load('src/components/website/static-pages.ts'),{articles}=load('src/components/website/website-articles.ts');
test('every public page has a title, description, keywords, canonical and sharing metadata',()=>{const paths=['/','/products','/contact',...informationPages.map(p=>'/'+p.slug),...products.map(p=>'/products/'+p.slug),...articles.map(p=>'/blog/'+p.slug)];for(const path of paths){const m=seo.seoMetadata(path);assert.ok(m.title.absolute,path);assert.ok(m.description,path);assert.ok(m.keywords.length,path);assert.equal(m.alternates.canonical,seo.siteSeo.url+path);assert.equal(m.openGraph.title,m.title.absolute);assert.equal(m.twitter.description,m.description);assert.equal(m.robots.index,true)}});
test('product aliases share the main canonical and stay out of sitemap',()=>{const urls=new Set(seo.seoSitemap().map(x=>x.url));for(const p of products)for(const alias of p.aliases){assert.equal(seo.seoMetadata('/products/'+alias).alternates.canonical,seo.siteSeo.url+'/products/'+p.slug);if(alias!==p.slug)assert.equal(urls.has(seo.siteSeo.url+'/products/'+alias),false)}assert.equal(urls.size,seo.seoSitemap().length);assert.equal(urls.has(seo.siteSeo.url+'/login'),false)});
test('private and missing routes are not indexable; sitemap is advertised',()=>{assert.equal(seo.privateMetadata.robots.index,false);assert.equal(seo.seoMetadata('/missing').robots.index,false);assert.equal(seo.seoRobots().sitemap,seo.siteSeo.url+'/sitemap.xml');assert.ok(fs.existsSync('public'+seo.siteSeo.image))});

test('editable slugs resolve old paths and aliases to one existing page',()=>{
 const routes=seo.buildSeoRoutes({'/about':{title:'About',description:'About us',path:'/about-magikpolicy',aliases:['/about-us']}});
 for(const path of ['/about','/about-us','/about-magikpolicy']){assert.equal(routes.get(path).source,'/about');assert.equal(routes.get(path).path,'/about-magikpolicy');}
});
test('invalid, conflicting, reserved and moved homepage paths are rejected',()=>{
 const page={title:'Test',description:'Test'};
 for(const path of ['/Bad Slug','/api/test','/partner/test','/admin','/about?x=1','https://example.com'])assert.throws(()=>seo.buildSeoRoutes({'/about':{...page,path}}));
 assert.throws(()=>seo.buildSeoRoutes({'/about':{...page,path:'/contact'},'/contact':page}));
 assert.throws(()=>seo.buildSeoRoutes({'/':{...page,path:'/home'}}));
});
test('legacy product aliases redirect directly to their canonical URL',()=>{
 for(const p of products)for(const alias of p.aliases){if(alias===p.slug)continue;const action=seo.seoRouteAction('/products/'+alias);assert.equal(action.type,'redirect');assert.equal(action.path,'/products/'+p.slug);assert.equal(seo.seoRouteAction(action.path),null);}
 assert.equal(seo.seoRouteAction('/unknown-page'),null);
});
