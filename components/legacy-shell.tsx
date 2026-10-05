"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Factory, FileClock, Gauge, Package, Settings, Truck, UserRound, UsersRound, Warehouse } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";
import type { Permission } from "@/lib/access";

const links: readonly (readonly [typeof Gauge,string,string,Permission])[] = [
  [Gauge,"Dashboard","/","View Dashboard"],[Activity,"Live Production","/live-production","View Daily Production"],[BarChart3,"Production Overview","/production-overview","View Daily Production"],[Package,"Delayed & Risk","/delayed-risk","View Daily Production"],[Activity,"Station Performance","/station-performance","View Daily Production"],[Warehouse,"Stock Management","/stock-management","View Stock"],[Truck,"Shipping","/shipping","View Shipping"],[Factory,"Factory Control Center","/factory-control-center","View Order Pool"],[FileClock,"Audit Logs","/audit-logs","View Audit Logs"],[UsersRound,"User Management","/user-management","Manage Users & Roles"],[Settings,"Settings","/","Manage Users & Roles"]
] as const;

export function LegacyShell({children}:{children:React.ReactNode}) { const path=usePathname(); const {user,can,logout}=useAuth(); return <SidebarProvider style={{"--sidebar-width":"13.2rem"} as React.CSSProperties}><Sidebar collapsible="offcanvas" className="rescro-sidebar"><SidebarHeader className="brand"><Link href="/"><Image src="/rescro-logo.png" alt="RESCRO" width={166} height={52} priority/></Link></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>{links.filter(([, , ,permission])=>can(permission)).map(([Icon,label,href])=><SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={path===href && (href!=="/" || label==="Dashboard")} tooltip={label}><Link href={href}><Icon/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter><button className="profile auth-profile" onClick={()=>void logout()} title="Log out"><span><UserRound/></span><span><b>{user?.name??"Account"}</b><small>{user?.role??""} · Log out</small></span></button></SidebarFooter></Sidebar><SidebarInset><main className="portal-shell legacy-page">{children}</main></SidebarInset></SidebarProvider>; }
