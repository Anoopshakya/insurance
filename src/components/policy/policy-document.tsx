"use client";
import {useState} from "react";
import {accessToken} from "@/lib/supabase-client";
export function PolicyDocument({id}:{id:string}){const [url,setUrl]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);return <div>{url?<a href={url} target="_blank" rel="noreferrer">View uploaded policy</a>:<button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch(`/api/policies/${id}/document`,{headers:{Authorization:`Bearer ${await accessToken()}`}});const b=await r.json();if(!r.ok)throw Error(b.error);setUrl(b.url)}catch(e){setError(e instanceof Error?e.message:"Unable to open policy")}finally{setBusy(false)}}}>{busy?"Loading?":"Open uploaded policy"}</button>}{error&&<p role="alert">{error}</p>}</div>}
