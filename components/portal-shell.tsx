"use client";
import {useI18n,LanguageSelector} from "@/components/i18n-provider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ClipboardCheck, ClipboardList, Factory, FileClock, LayoutDashboard, Settings, ShieldCheck, Truck, UserRound, UsersRound } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

const navigation = [
  [LayoutDashboard, "Dashboard", "/"], [ClipboardList, "Orders", "/orders"], [Factory, "Production", "/production"],
  [ClipboardCheck, "Today's Production", "/today-production"], [ShieldCheck, "Quality Control", "/quality-control"], [Boxes, "Stock", "/stock"],
  [Truck, "Shipping Center", "/shipping"], [BarChart3, "Reports", "/reports"], [FileClock, "Audit Logs", "/audit-logs"],
  [UsersRound, "User Management", "/user-management"], [Settings, "Settings", "/settings"],
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) { const {t,locale} = useI18n(); 
  const pathname = usePathname();
  return <SidebarProvider style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
    <Sidebar collapsible="offcanvas" className="rescro-sidebar"><SidebarHeader className="brand"><span>{"RESCRO"}</span><small>{t("FACTORY OS")}</small></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupContent><SidebarMenu>
      {navigation.map(([Icon, label, href]) => <SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={pathname === href} tooltip={t(label)}><Link href={href}><Icon /><span>{t(label)}</span></Link></SidebarMenuButton></SidebarMenuItem>)}
    </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter><div className="profile"><span><UserRound /></span><span><b>{t("Admin")}</b><small>{t("Super Admin")}</small></span></div></SidebarFooter></Sidebar>
    <SidebarInset><main className="portal-shell factory-shell"><div className="portal-language-tools"><LanguageSelector/></div>{children}</main></SidebarInset>
  </SidebarProvider>;
}
