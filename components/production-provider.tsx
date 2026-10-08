"use client";
import {useI18n} from "@/components/i18n-provider";
import { createContext,useContext,useEffect,useState,useCallback,useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { emptyProduction,type ProductionSnapshot,type WorkStation } from "@/lib/production-model";
import { setProductionSnapshot } from "@/lib/release";
type ProductionContext={snapshot:ProductionSnapshot;loading:boolean;error:string;refresh:(force?:boolean)=>Promise<void>;complete:(itemId:string,station:WorkStation)=>Promise<void>};
const Context=createContext<ProductionContext|null>(null);
export function ProductionProvider({children}:{children:React.ReactNode}){ const {t,locale} = useI18n(); 
  const {user}=useAuth();const [snapshot,setSnapshot]=useState(emptyProduction);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const pending=useRef<Promise<void>|null>(null);const generation=useRef(0);
  const refresh=useCallback(async(force=false)=>{
    if(!user)return;if(pending.current){await pending.current;if(!force)return;}
    const version=generation.current;
    const run=(async()=>{try{const response=await fetch("/api/production",{cache:"no-store"});const value=await response.json();if(!response.ok)throw new Error(value.error??"Could not load production.");if(version!==generation.current)return;setProductionSnapshot(value);setSnapshot(value);setError("");window.dispatchEvent(new Event("rescro-release-updated"));}catch(error){if(version===generation.current)setError(error instanceof Error?error.message:"Production unavailable.");}finally{if(version===generation.current)setLoading(false);}})();
    pending.current=run;await run;if(pending.current===run)pending.current=null;
  },[user]);
  useEffect(()=>{
    generation.current++;pending.current=null;
    setProductionSnapshot(emptyProduction);setSnapshot(emptyProduction);setLoading(Boolean(user));setError("");
    if(!user)return;
    void refresh();const sync=()=>{void refresh();};const focus=()=>{if(document.visibilityState==="visible")sync();};
    const timer=setInterval(()=>{if(document.visibilityState==="visible")sync();},8000);
    window.addEventListener("rescro-production-refresh",sync);window.addEventListener("focus",sync);document.addEventListener("visibilitychange",focus);
    return()=>{generation.current++;clearInterval(timer);window.removeEventListener("rescro-production-refresh",sync);window.removeEventListener("focus",sync);document.removeEventListener("visibilitychange",focus);};
  },[user,refresh]);
  const complete=async(itemId:string,station:WorkStation)=>{const response=await fetch("/api/production",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"complete",itemId,station,source:"daily-production",run:snapshot.items.find(item=>item.id===itemId)?.run})});const result=await response.json();if(!response.ok){await refresh(true);throw new Error(result.error??"Could not complete item.");}await refresh(true);};
  return <Context.Provider value={{snapshot,loading,error,refresh,complete}}>{children}</Context.Provider>;
}
export function useProduction(){const value=useContext(Context);if(!value)throw new Error("Missing production provider");return value;}
export function ProductionNotice(){ const {t,locale} = useI18n(); const {error,loading,refresh}=useProduction();if(!error&&!loading)return null;return <div className="production-service-notice" role={error?"alert":"status"}>{t(error) || t("Loading shared production records…")}{error&&<button onClick={()=>void refresh()}>{t("Retry")}</button>}</div>;}
