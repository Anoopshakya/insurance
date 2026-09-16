import {load} from "cheerio";
import {safeProductHtml,plainProductText} from "./product-html";
const headings:Record<string,RegExp>={overview:/overview|about (?:this|the) (?:plan|product|policy)|introduction/i,benefits:/benefits|features|what(?: is|'s) covered/i,exclusions:/exclusions|not covered|what(?: is|'s) not/i,eligibility:/eligibility|entry age|who can/i,sumInsured:/sum insured|coverage (?:amount|limit)/i,waitingPeriods:/waiting period/i,roomRent:/room rent/i,copay:/co.?pay/i,hospitalisation:/hospitali[sz]ation/i,vehicleType:/vehicle (?:type|eligibility)/i,coverType:/cover(?:age)? type/i,idv:/insured declared value|\bidv\b/i,deductibles:/deductible/i,noClaimBonus:/no.claim bonus|\bncb\b/i,personalAccident:/personal accident/i,addOns:/add.ons?|optional (?:cover|benefit)/i,claims:/claim (?:process|procedure)|how to claim/i,faq:/frequently asked|faq/i};
export type WebsiteSection={key:string;label:string;html:string};
export function extractProductWebsite(html:string,url:string){const $=load(html);$('script,style,noscript,iframe,nav,footer,form,aside,[hidden],[aria-hidden="true"]').remove();$('a[href]').each((_,el)=>{try{$(el).attr('href',new URL($(el).attr('href')!,url).href)}catch{$(el).removeAttr('href')}});
 const title=$('h1').first().text().trim()||$('title').text().trim();const root=$('main').first().length?$('main').first():$('article').first().length?$('article').first():$('body');
 const sections:WebsiteSection[]=[];let current:WebsiteSection|null=null;
 root.find('h1,h2,h3,h4,h5,h6,summary,p,ul,ol,table,blockquote').each((_,el)=>{
 const tag=el.tagName.toLowerCase();if($(el).parents('ul,ol,table,blockquote').length)return;
 if(/^h[1-6]$/.test(tag)||tag==='summary'){
  const label=$(el).text().trim();const found=Object.entries(headings).find(([,pattern])=>pattern.test(label));
  if(found){current={key:found[0],label,html:''};sections.push(current)}else if(tag==='h1'){current={key:'overview',label:'Overview',html:''};sections.push(current)}else if(current&&['h3','h4','summary'].includes(tag)){current.html+='<h4>'+safeProductHtml($(el).text())+'</h4>';}else{current=null;}return;
 }
 if(current&&current.html.length<18000){const fragment=safeProductHtml($.html(el));if(current.html.length+fragment.length<=20000)current.html+=fragment;}
 });
 const usable=sections.filter(s=>plainProductText(s.html));const pdfs:Array<{title:string;url:string}>=[];$('a[href]').each((_,el)=>{const href=$(el).attr('href')||'';if(/^https?:/.test(href)&&/\.pdf(?:[?#]|$)/i.test(href)&&pdfs.length<20&&!pdfs.some(p=>p.url===href))pdfs.push({title:$(el).text().trim()||'PDF document',url:href})});
 return {title,sections:usable.slice(0,40),pdfs,sourceUrl:url,importedAt:new Date().toISOString(),warning:usable.length?'Imported content is unverified. Check limits, exclusions and eligibility against the insurer documents.':'No structured product sections found. This page may require JavaScript or block automated access. Use a product brochure or enter content manually.'};}
