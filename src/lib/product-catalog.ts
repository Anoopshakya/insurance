import {cleanProductContent,plainProductText} from "./product-html";
import {z} from "zod";
export const categoryFields={
 health:[['eligibility','Entry age & eligibility'],['sumInsured','Sum insured options'],['waitingPeriods','Waiting periods'],['roomRent','Room rent limits'],['copay','Co-pay & deductibles'],['hospitalisation','Hospitalisation benefits']],
 motor:[['vehicleType','Vehicle eligibility'],['coverType','Cover type'],['idv','IDV information'],['deductibles','Deductibles'],['noClaimBonus','No-claim bonus'],['personalAccident','Personal accident cover']],
} as const;
export const commonFields=[['overview','Overview'],['benefits','Key benefits'],['exclusions','Exclusions'],['addOns','Optional covers'],['claims','Claims process'],['faq','Frequently asked questions']] as const;
export const productSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(2).max(150),categoryId:z.string().uuid(),productTypeId:z.string().uuid(),insurerId:z.string().uuid(),template:z.enum(['health','motor']),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),productCode:z.string().max(100).default(''),status:z.enum(['draft','review']).default('draft'),content:z.record(z.string().max(60),z.string().max(200000)).transform(cleanProductContent),plans:z.array(z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(150),description:z.string().max(10000).default('')})).max(30)});
export function publicationErrors(product:{name?:string;slug?:string;template?:string;content?:Record<string,string>;insurer_id?:string;product_type_id?:string}){
 const c=product.content||{};return [!product.name&&'Product name',!product.slug&&'Page slug',!product.insurer_id&&'Insurer',!product.product_type_id&&'Product type',!product.template&&'Category template',...(typeof c.pageHtml==='string'?[!plainProductText(c.pageHtml)&&'Page content']:[!plainProductText(c.overview||'')&&'Overview',!plainProductText(c.benefits||'')&&'Benefits',!plainProductText(c.exclusions||'')&&'Exclusions']),!c.seoDescription?.trim()&&'SEO description'].filter(Boolean) as string[];
}

export function productValidationMessages(issues:ReadonlyArray<{path:(string|number)[];message:string}>){
 const labels:Record<string,string>={name:'Product name',categoryId:'Category',productTypeId:'Product type',insurerId:'Insurer',slug:'Page slug',productCode:'Product identifier / UIN',template:'Detail template',pageHtml:'Page content',seoDescription:'SEO description',seoTitle:'SEO title',keywords:'Keywords'};
 return issues.map(issue=>{const key=String(issue.path[0]);const label=key==='plans'?`Plan ${Number(issue.path[1])+1} ${issue.path[2]||''}`:labels[String(issue.path.at(-1))]||issue.path.join(' > ');if(['categoryId','productTypeId','insurerId'].includes(key))return `${label}: select a valid option in Basic information.`;if(key==='slug')return 'Page slug: use lowercase letters, numbers and single hyphens only (maximum 120 characters).';return `${label}: ${issue.message}`;});
}
