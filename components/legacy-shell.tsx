"use client";
import {useI18n,LanguageSelector} from "@/components/i18n-provider";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Factory, FileClock, Gauge, Package, Settings, Truck, UserRound, UsersRound, Warehouse } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";
import type { Permission } from "@/lib/access";

const links: readonly (readonly [typeof Gauge,string,string,Permission])[] = [
  [Gauge,"Dashboard","/","View Dashboard"],
  [Factory,"Daily Production","/daily-production","View Daily Production"],
  [Factory,"Fabrika Talepleri","/factory-requests","View Factory Requests"],
  [Package,"Delayed & Risk","/delayed-risk","View Daily Production"],
  [Truck,"Shipping","/shipping","View Shipping"],
  [Warehouse,"Stock Management","/stock-management","View Stock"],
  [BarChart3,"Production Overview","/production-overview","View Daily Production"],
  [Activity,"Live Production","/live-production","View Daily Production"],
  [Factory,"Factory Control Center","/factory-control-center","View Order Pool"],
  [FileClock,"Audit Logs","/audit-logs","View Audit Logs"],
  [UsersRound,"User Management","/user-management","Manage Users & Roles"],
  [Settings,"Settings","/","Manage Users & Roles"]
] as const;

export function LegacyShell({children}:{children:React.ReactNode}) { const {t,locale} = useI18n();  const path=usePathname(); const {user,can,logout}=useAuth(); return <SidebarProvider style={{"--sidebar-width":"13.2rem"} as React.CSSProperties}><Sidebar collapsible="offcanvas" className="rescro-sidebar"><SidebarHeader className="brand"><Link href="/"><Image src="/rescro-logo.png" alt="RESCRO" width={166} height={52} priority/></Link></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>{links.filter(([, , href,permission])=>(can(permission)||(href==="/factory-requests"&&user?.role==="Customer Service")) && (href!=="/factory-control-center" || user?.role==="Admin")).map(([Icon,label,href])=><SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={path===href && (href!=="/" || label==="Dashboard")} tooltip={t(label)}><Link href={href}><Icon/><span>{t(label)}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter><button className="profile auth-profile" onClick={()=>void logout()} title={t("Log out")}><span><UserRound/></span><span><b>{user?.name ?? t("Account")}</b><small>{t(user?.role) ?? ""} {t(" · Log out")}</small></span></button></SidebarFooter></Sidebar><SidebarInset><main className="portal-shell legacy-page"><div className="portal-language-tools"><LanguageSelector/><span className="language-profile" title={user?.name}><UserRound size={18}/><span>{user?.name}</span></span></div>{children}</main></SidebarInset></SidebarProvider>; }
