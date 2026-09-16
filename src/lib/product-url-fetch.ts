import {lookup} from "node:dns/promises";
import {isIP,type LookupFunction} from "node:net";
import {request as httpRequest} from "node:http";
import {request as httpsRequest} from "node:https";
import ipaddr from "ipaddr.js";
export function publicWebsiteUrl(input:string){const url=new URL(input);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))throw Error('Use a public HTTP or HTTPS website URL without credentials or custom ports.');const host=url.hostname.replace(/^\[|\]$/g,'').toLowerCase();if(isIP(host)||!host.includes('.')||/\.(localhost|local|internal|test|invalid)$/.test(host))throw Error('Use a public website domain.');url.hash='';return url;}
export function isPublicAddress(address:string){try{return ipaddr.process(address).range()==='unicast'}catch{return false}}
async function resolvePublic(host:string){let timer:ReturnType<typeof setTimeout>|undefined;try{const addresses=await Promise.race([lookup(host,{all:true,verbatim:true}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Website DNS lookup timed out.')),4000)})]);if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw Error('Private or reserved network addresses cannot be imported.');return addresses[0];}finally{clearTimeout(timer)}}
export async function fetchProductWebsite(input:string){let url=publicWebsiteUrl(input);const deadline=Date.now()+20000;for(let hop=0;hop<4;hop++){
 const address=await resolvePublic(url.hostname);if(Date.now()>=deadline)throw Error('Website request timed out.');
 const response=await new Promise<{status:number;location?:string;html:string}>((resolve,reject)=>{
 const pinned:LookupFunction=(_host,options,callback)=>{if(options.all)callback(null,[address]);else callback(null,address.address,address.family)};
 const req=(url.protocol==='https:'?httpsRequest:httpRequest)(url,{method:'GET',agent:false,lookup:pinned,family:address.family,headers:{Accept:'text/html,application/xhtml+xml','Accept-Encoding':'identity','User-Agent':'MagikPolicy-ProductImport/1.0'}},res=>{
 const status=res.statusCode||500;if([301,302,303,307,308].includes(status)){const location=res.headers.location;res.destroy();resolve({status,location,html:''});return;}
 if(status!==200){res.destroy();reject(Error(`Website returned HTTP ${status}. Use a publicly accessible product page.`));return;}
 if(!/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(res.headers['content-type']||'')){res.destroy();reject(Error('This URL is not an HTML page. Use PDF import for brochures.'));return;}
 if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();reject(Error('This website returned unsupported compressed content. Copy the text or use its PDF brochure.'));return;}
 const chunks:Buffer[]=[];let size=0;res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>2*1024*1024){req.destroy(Error('Website exceeds the 2 MB import limit.'));return;}chunks.push(chunk)});res.on('error',reject);res.on('end',()=>resolve({status,html:Buffer.concat(chunks).toString('utf8')}));
 });const timer=setTimeout(()=>req.destroy(Error('Website request timed out.')),Math.max(1,deadline-Date.now()));req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
 });if(response.location){url=publicWebsiteUrl(new URL(response.location,url).href);continue;}if(response.status!==200)throw Error('Website redirect was missing a destination.');return {url:url.href,html:response.html};
 }throw Error('Website redirected too many times. Paste the final product URL.');}
