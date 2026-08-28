export function slugify(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export const catalogName=(value:unknown)=>String(value??"").trim().slice(0,100);
