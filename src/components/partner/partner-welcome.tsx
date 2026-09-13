import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, FileCheck2, ShieldCheck, Trophy, Users } from "lucide-react";
const steps = [
  {title:"Add a Customer",text:"Start with someone you know. Add your first customer or lead.",Icon:Users,tone:"blue",href:"/partner/customers"},
  {title:"Get a Quote",text:"Explore suitable plans and share the options with your customer.",Icon:FileCheck2,tone:"green",href:"/products"},
  {title:"Close the Policy",text:"Help your customer choose the right protection.",Icon:ShieldCheck,tone:"orange",href:"/partner/policies"},
  {title:"Earn & Grow",text:"Track your rewards and build lasting customer relationships.",Icon:BarChart3,tone:"violet",href:"/partner/earnings"},
];
export function PartnerWelcome({name}:{name:string}) {
 return <section className="partner-welcome-start" aria-labelledby="partner-welcome-title">
   <header><div><h1 id="partner-welcome-title">Welcome to MagikPolicy, {name}!</h1><p>Your next chapter starts with helping someone find the right protection.</p></div><div className="partner-start-badge"><Trophy aria-hidden="true"/><div><strong>Let&apos;s Get Started</strong><span>Let&apos;s achieve great milestones together!</span></div></div></header>
   <div className="partner-start-hero"><Image src="/brand/partner-welcome.png" width={1536} height={1024} sizes="(max-width: 700px) 90vw, 580px" alt="" priority/><h2>You&apos;re All Set!</h2><p>You don&apos;t have any activity yet, but you&apos;re just a few steps away from creating your first lead and growing your business.</p><Link className="partner-start-cta" href="/partner/leads?create=1">Create Your First Lead <ArrowRight aria-hidden="true"/></Link><small>New to the platform? <Link href="/partner-resources">Explore partner resources</Link></small></div>
   <ol className="partner-start-steps">{steps.map(({title,text,Icon,tone,href},index)=><li key={title}><Link href={href}><span className={tone}><Icon aria-hidden="true"/></span><h3>{index+1}. {title}</h3><p>{text}</p></Link>{index<3&&<ArrowRight className="partner-step-arrow" aria-hidden="true"/>}</li>)}</ol>
 </section>;
}
