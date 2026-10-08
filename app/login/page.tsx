"use client";
import {useI18n,LanguageSelector} from "@/components/i18n-provider";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() { const {t,locale} = useI18n(); 
  const router = useRouter(); const { refresh } = useAuth();
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Login failed");await refresh();const next=new URLSearchParams(window.location.search).get("next");router.replace(next?.startsWith("/")&&!next.startsWith("//")?next:data.user?.role==="Admin"||data.user?.permissions?.includes("View Dashboard")?"/":"/daily-production");}catch(e){setError(e instanceof Error?e.message:"Login failed");}finally{setBusy(false);}}
  return <main className="auth-screen"><div className="auth-language-tools"><LanguageSelector/></div><section className="auth-card"><div className="auth-brand"><Image src="/rescro-logo.png" alt="RESCRO" width={180} height={56} priority/></div><span className="auth-kicker">{t("PRODUCTION PORTAL")}</span><h1>{t("Sign in")}</h1><p>{t("Use your RESCRO Portal username and password.")}</p><form onSubmit={submit}><label>{t("Username / Email")}<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder={"name@department.com"} required/></label><label>{t("Password")}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error?<div className="auth-error" role="alert">{t(error)}</div>:null}<button disabled={busy}>{busy ? t("Signing in…") : <><LockKeyhole size={16}/> Login</>}</button></form><small>{t("Email verification is not required. The email format is used as your username.")}</small><Link href="/setup" className="setup-link">{t("First time setup")}</Link></section></main>;
}
