"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter(); const search = useSearchParams(); const { refresh } = useAuth();
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Login failed");await refresh();const next=search.get("next");router.replace(next?.startsWith("/")&&!next.startsWith("//")?next:"/");}catch(e){setError(e instanceof Error?e.message:"Login failed");}finally{setBusy(false);}}
  return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><Image src="/rescro-logo.png" alt="RESCRO" width={180} height={56} priority/></div><span className="auth-kicker">PRODUCTION PORTAL</span><h1>Sign in</h1><p>Use your RESCRO Portal username and password.</p><form onSubmit={submit}><label>Username / Email<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="name@department.com" required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error?<div className="auth-error" role="alert">{error}</div>:null}<button disabled={busy}>{busy?"Signing in…":<><LockKeyhole size={16}/> Login</>}</button></form><small>Email verification is not required. The email format is used as your username.</small><Link href="/setup" className="setup-link">First time setup</Link></section></main>;
}
