import type {Metadata, MetadataRoute} from "next";
import {products} from "@/components/website/website-products";
import {informationPages} from "@/components/website/static-pages";
import {articles} from "@/components/website/website-articles";

/** All public page SEO is managed here. Edit pageOverrides by canonical URL.
 * Keep object keys unchanged: they identify the existing page route.
 * Change path to customize its public URL. Save previous paths in aliases.
 * Example: "/about": {path:"/about-magikpolicy",aliases:["/about-us"],...}
 * Slug changes take effect after restarting/redeploying the application. */
export const siteSeo={name:"MagikPolicy",url:"https://www.magikpolicy.com",description:"Explore insurance options, request quotations and get policy guidance with MagikPolicy.",keywords:["insurance India","insurance quotes","health insurance","motor insurance","life insurance"],image:"/android-chrome-512x512.png"};
export type PageSeo={path?:string;aliases?:string[];title:string;description:string;keywords?:string[];image?:string;noindex?:boolean;type?:"website"|"article"};
export const pageOverrides:Record<string,PageSeo>={
  "/insurance":{title:"Insurance Products & Plans",description:"Explore insurer products, benefits, policy documents and request an insurance quote.",path:"/insurance",aliases:[]},
  "/become-partner": {
    "path": "/become-partner",
    "aliases": [],
    "title": "Build your insurance business with us",
    "description": "Understand the registration journey, prepare your information and explore the partner workspace.",
    "keywords": [
      "Partner with MagikPolicy",
      "insurance guidance"
    ]
  },
  "/partner-resources": {
    "path": "/partner-resources",
    "aliases": [],
    "title": "Practical resources for your daily work",
    "description": "A starting point for onboarding, managing enquiries and keeping customer information organised.",
    "keywords": [
      "Partner knowledge centre",
      "insurance guidance"
    ]
  },
  "/training-support": {
    "path": "/training-support",
    "aliases": [],
    "title": "Learn the process. Get help when you need it.",
    "description": "Use these learning topics to build confidence with the portal and customer conversations.",
    "keywords": [
      "Partner development",
      "insurance guidance"
    ]
  },
  "/partner-faqs": {
    "path": "/partner-faqs",
    "aliases": [],
    "title": "Answers for your partner journey",
    "description": "Find the next step for registration, profile completion and everyday portal questions.",
    "keywords": [
      "Partner help",
      "insurance guidance"
    ]
  },
  "/complaints": {
    "path": "/complaints",
    "aliases": [],
    "title": "Help us understand what went wrong",
    "description": "Choose the right contact for a website issue or a concern about an insurance policy.",
    "keywords": [
      "Support and grievance assistance",
      "insurance guidance"
    ]
  },
  "/faqs": {
    "path": "/faqs",
    "aliases": [],
    "title": "A clearer starting point for insurance",
    "description": "General answers to help you prepare for a conversation. Your policy documents define your actual cover.",
    "keywords": [
      "Insurance questions",
      "insurance guidance"
    ]
  },
  "/our-mission": {
    "path": "/our-mission",
    "aliases": [],
    "title": "Make insurance easier to understand",
    "description": "Our aim is to help people ask better questions, understand their options and take the next step with confidence.",
    "keywords": [
      "What guides us",
      "insurance guidance"
    ]
  },
  "/how-it-works": {
    "path": "/how-it-works",
    "aliases": [],
    "title": "From a question to an informed choice",
    "description": "Start with the protection you need. We help organise the next conversation.",
    "keywords": [
      "Your next steps",
      "insurance guidance"
    ]
  },
  "/careers": {
    "path": "/careers",
    "aliases": [],
    "title": "Help make insurance easier for people",
    "description": "Interested in customer support, partner operations or building better digital experiences? Start a conversation with us.",
    "keywords": [
      "Work with MagikPolicy",
      "insurance guidance"
    ]
  },
  "/blog": {
    "path": "/blog",
    "aliases": [],
    "title": "Small reads. Better questions.",
    "description": "Practical checklists for comparing options, preparing for renewal and keeping policy documents organised.",
    "keywords": [
      "MagikPolicy guides",
      "insurance guidance"
    ]
  },
  "/disclaimer": {
    "path": "/disclaimer",
    "aliases": [],
    "title": "Disclaimer",
    "description": "How to understand the information and quotation requests on this website.",
    "keywords": [
      "Website information",
      "insurance guidance"
    ]
  },
  "/terms": {
    "path": "/terms",
    "aliases": [],
    "title": "Terms & Conditions",
    "description": "The basis on which you can use MagikPolicy's website and submit an enquiry.",
    "keywords": [
      "Using this website",
      "insurance guidance"
    ]
  },
  "/privacy-policy": {
    "path": "/privacy-policy",
    "aliases": [],
    "title": "Privacy Policy",
    "description": "How information submitted through this website is used to handle your enquiry and account activity.",
    "keywords": [
      "Your information",
      "insurance guidance"
    ]
  },
  "/refund-policy": {
    "path": "/refund-policy",
    "aliases": [],
    "title": "Refund & cancellation information",
    "description": "Find the relevant terms and contact for a payment, cancellation or refund question.",
    "keywords": [
      "Cancellation enquiries",
      "insurance guidance"
    ]
  },
  "/sitemap": {
    "path": "/sitemap",
    "aliases": [],
    "title": "Find your way around",
    "description": "Browse products, support pages and company information from one place.",
    "keywords": [
      "Explore MagikPolicy",
      "insurance guidance"
    ]
  },
  "/about": {
    "path": "/about",
    "aliases": [],
    "title": "Insurance, made easier to understand",
    "description": "Explore insurance options, request assistance and connect with the team for your next step.",
    "keywords": [
      "About MagikPolicy",
      "insurance guidance"
    ]
  },
  "/contact": {
    "path": "/contact",
    "aliases": [],
    "title": "Contact Us",
    "description": "Contact MagikPolicy for insurance questions, quotation requests, policy support and guidance.",
    "keywords": [
      "Contact us",
      "insurance guidance"
    ]
  },
  "/resources": {
    "path": "/resources",
    "aliases": [],
    "title": "Useful guides in one place",
    "description": "Prepare for your next insurance conversation with practical checklists and answers.",
    "keywords": [
      "Knowledge centre",
      "insurance guidance"
    ]
  },
  "/renew": {
    "path": "/renew",
    "aliases": [],
    "title": "Prepare for your next policy year",
    "description": "Review your existing cover and gather the information needed for a renewal conversation.",
    "keywords": [
      "Policy renewal",
      "insurance guidance"
    ]
  },
  "/claims": {
    "path": "/claims",
    "aliases": [],
    "title": "Know the next step when you need support",
    "description": "Keep your policy details ready and contact the insurer through its official claims channel.",
    "keywords": [
      "Claim assistance",
      "insurance guidance"
    ]
  },
  "/products/health-insurance": {
    "path": "/products/health-insurance",
    "aliases": [],
    "title": "Health Insurance",
    "description": "Explore health cover for hospital expenses and understand the details before you choose.",
    "keywords": [
      "Health Insurance",
      "Health Insurance quotation",
      "Health Insurance coverage"
    ]
  },
  "/products/car-insurance": {
    "path": "/products/car-insurance",
    "aliases": [],
    "title": "Car Insurance",
    "description": "Compare car insurance options around your vehicle, its use and your coverage needs.",
    "keywords": [
      "Car Insurance",
      "Car Insurance quotation",
      "Car Insurance coverage"
    ]
  },
  "/products/bike-insurance": {
    "path": "/products/bike-insurance",
    "aliases": [],
    "title": "Bike Insurance",
    "description": "Find out what to compare when choosing insurance for your two-wheeler.",
    "keywords": [
      "Bike Insurance",
      "Bike Insurance quotation",
      "Bike Insurance coverage"
    ]
  },
  "/products/term-life-insurance": {
    "path": "/products/term-life-insurance",
    "aliases": [],
    "title": "Term Life Insurance",
    "description": "Explore life protection with your dependants, responsibilities and chosen cover period in mind.",
    "keywords": [
      "Term Life Insurance",
      "Term Life Insurance quotation",
      "Term Life Insurance coverage"
    ]
  },
  "/products/travel-insurance": {
    "path": "/products/travel-insurance",
    "aliases": [],
    "title": "Travel Insurance",
    "description": "Explore protection for your trip, from medical emergencies to specified travel disruptions.",
    "keywords": [
      "Travel Insurance",
      "Travel Insurance quotation",
      "Travel Insurance coverage"
    ]
  },
  "/products/family-insurance": {
    "path": "/products/family-insurance",
    "aliases": [],
    "title": "Family Insurance",
    "description": "Explore family health insurance with the needs of every member in mind.",
    "keywords": [
      "Family Insurance",
      "Family Insurance quotation",
      "Family Insurance coverage"
    ]
  },
  "/products/personal-accident-insurance": {
    "path": "/products/personal-accident-insurance",
    "aliases": [],
    "title": "Personal Accident Insurance",
    "description": "Understand cover for specified accidental injuries and their financial impact.",
    "keywords": [
      "Personal Accident Insurance",
      "Personal Accident Insurance quotation",
      "Personal Accident Insurance coverage"
    ]
  },
  "/products/motor-insurance": {
    "path": "/products/motor-insurance",
    "aliases": [],
    "title": "Motor Insurance",
    "description": "Explore vehicle cover and choose the insurance category that fits your car or two-wheeler.",
    "keywords": [
      "Motor Insurance",
      "Motor Insurance quotation",
      "Motor Insurance coverage"
    ]
  },
  "/products/life-insurance": {
    "path": "/products/life-insurance",
    "aliases": [],
    "title": "Life Insurance",
    "description": "Understand life insurance benefits, commitments and options before choosing a plan.",
    "keywords": [
      "Life Insurance",
      "Life Insurance quotation",
      "Life Insurance coverage"
    ]
  },
  "/products/investment-plans": {
    "path": "/products/investment-plans",
    "aliases": [],
    "title": "Investment Plans",
    "description": "Discuss your goals and understand product risks, costs and commitments.",
    "keywords": [
      "Investment Plans",
      "Investment Plans quotation",
      "Investment Plans coverage"
    ]
  },
  "/blog/compare-insurance-quotations": {
    "path": "/blog/compare-insurance-quotations",
    "aliases": [],
    "title": "What to compare in an insurance quotation",
    "description": "Look beyond the headline premium and prepare a consistent set of questions for each option.",
    "keywords": [
      "Buying guide",
      "insurance guide"
    ],
    "type": "article"
  },
  "/blog/policy-renewal-checklist": {
    "path": "/blog/policy-renewal-checklist",
    "aliases": [],
    "title": "A practical policy renewal checklist",
    "description": "Give yourself time to review the information and questions that matter for the next policy period.",
    "keywords": [
      "Renewal guide",
      "insurance guide"
    ],
    "type": "article"
  },
  "/blog/organise-policy-documents": {
    "path": "/blog/organise-policy-documents",
    "aliases": [],
    "title": "Keep your policy documents easy to find",
    "description": "A small amount of organisation can make policy service conversations easier.",
    "keywords": [
      "Policy essentials",
      "insurance guide"
    ],
    "type": "article"
  },
  "/": {
    "path": "/",
    "aliases": [],
    "title": "Insurance Quotes, Cover Options & Policy Support",
    "description": "Explore health, motor, life and personal accident insurance with MagikPolicy. Request a quotation and get help with policies, renewals and claims.",
    "keywords": [
      "insurance India",
      "insurance quotes",
      "health insurance",
      "motor insurance",
      "life insurance"
    ]
  },
  "/products": {
    "path": "/products",
    "aliases": [],
    "title": "Explore Insurance Products",
    "description": "Explore health, motor, term life, travel and personal accident insurance. Compare cover options and request an insurance quotation with MagikPolicy.",
    "keywords": [
      "insurance India",
      "insurance quotes",
      "health insurance",
      "motor insurance",
      "life insurance"
    ]
  },
  "/login": {
    "path": "/login",
    "aliases": [],
    "title": "Sign In",
    "description": "Sign in to your MagikPolicy account.",
    "noindex": true
  }
};
type RouteTarget={source:string;path:string};
export function buildSeoRoutes(pages:Record<string,PageSeo>){
 const routes=new Map<string,RouteTarget>();
 const valid=(path:string)=>path==="/"||/^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(path);
 const reserved=(path:string)=>/^\/(?:api|admin|partner|customer|auth)(?:\/|$)/.test(path)||["/for-partner","/for-partners"].includes(path);
 for(const [source,page] of Object.entries(pages)){
  const path=page.path||source;
  if(source==="/"&&path!=="/")throw Error("Keep the homepage path as /");
  const product=products.find(p=>"/products/"+p.slug===source);
  for(const url of [source,path,...(page.aliases||[]),...(product?.aliases.map(alias=>"/products/"+alias)||[])]){
   if(!valid(url)||reserved(url))throw Error(`Invalid or reserved SEO path: ${url}`);
   const existing=routes.get(url);if(existing&&existing.source!==source)throw Error(`Duplicate SEO path: ${url}`);
   routes.set(url,{source,path});
  }
 }
 return routes;
}
const seoRoutes=buildSeoRoutes(pageOverrides);
export function resolveSeoRoute(path:string){return seoRoutes.get(path.replace(/\/$/,"")||"/");}
export function canonicalPath(path:string){const clean=path.split(/[?#]/)[0].replace(/\/$/,"")||"/";return resolveSeoRoute(clean)?.path||clean;}
/** Used before routing: redirects old URLs and rewrites custom URLs to the existing page. */
export function seoRouteAction(path:string){const target=resolveSeoRoute(path);if(!target)return null;if(path!==target.path)return {type:"redirect" as const,path:target.path};if(target.path!==target.source)return {type:"rewrite" as const,path:target.source};return null;}
export function seoMetadata(path:string):Metadata{
 const canonical=canonicalPath(path),entry=pageOverrides[resolveSeoRoute(canonical)?.source||canonical];
 if(!entry?.title||!entry.description)return {title:"Page Not Found",robots:{index:false,follow:false}};
 const title=`${entry.title} | ${siteSeo.name}`,image=entry.image||siteSeo.image;
 return {title:{absolute:title},description:entry.description,keywords:entry.keywords||siteSeo.keywords,alternates:{canonical:siteSeo.url+canonical},robots:{index:!entry.noindex,follow:true},openGraph:{type:entry.type||"website",siteName:siteSeo.name,locale:"en_IN",url:siteSeo.url+canonical,title,description:entry.description,images:[{url:image,alt:siteSeo.name}]},twitter:{card:"summary",title,description:entry.description,images:[image]}};
}
export const privateMetadata:Metadata={title:"Account | MagikPolicy",robots:{index:false,follow:false}};
export const rootMetadata:Metadata={metadataBase:new URL(siteSeo.url),title:{default:siteSeo.name,template:"%s | MagikPolicy"},description:siteSeo.description,keywords:siteSeo.keywords,manifest:"/site.webmanifest",icons:{icon:[{url:"/favicon.ico"},{url:"/favicon-16x16.png",sizes:"16x16",type:"image/png"},{url:"/favicon-32x32.png",sizes:"32x32",type:"image/png"}],apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]}};
export function seoSitemap():MetadataRoute.Sitemap{return Object.keys(pageOverrides).filter(path=>!pageOverrides[path]?.noindex).map(path=>({url:siteSeo.url+canonicalPath(path)}));}
export function seoRobots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/api/"]},sitemap:siteSeo.url+"/sitemap.xml"};}
