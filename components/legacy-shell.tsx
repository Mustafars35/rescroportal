"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Boxes, ClipboardList, Factory, FileClock, Gauge, Package, Settings, Truck, UserRound, UsersRound, Warehouse } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

const links = [
  [Gauge,"Dashboard","/"],[ClipboardList,"Orders","/"],[Factory,"Production","/"],[Activity,"Live Production","/live-production"],[BarChart3,"Production Overview","/production-overview"],[Package,"Delayed & Risk","/delayed-risk"],[Activity,"Station Performance","/station-performance"],[Boxes,"Products","/"],[Warehouse,"Stock Management","/stock-management"],[Truck,"Shipping","/shipping"],[Factory,"Factory Control Center","/factory-control-center"],[FileClock,"Audit Logs","/"],[UsersRound,"User Management","/"],[Settings,"Settings","/"]
] as const;

export function LegacyShell({children}:{children:React.ReactNode}) { const path=usePathname(); return <SidebarProvider style={{"--sidebar-width":"13.2rem"} as React.CSSProperties}><Sidebar collapsible="offcanvas" className="rescro-sidebar"><SidebarHeader className="brand"><Link href="/">RESCRO</Link></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>{links.map(([Icon,label,href])=><SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={path===href && (href!=="/" || label==="Dashboard")} tooltip={label}><Link href={href}><Icon/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter><div className="profile"><span><UserRound/></span><span><b>Admin</b><small>Super Admin</small></span></div></SidebarFooter></Sidebar><SidebarInset><main className="portal-shell legacy-page">{children}</main></SidebarInset></SidebarProvider>; }
