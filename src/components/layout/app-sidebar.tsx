"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Database,
  FileText,
  LayoutDashboard,
  Map,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Overview", href: "/overview", icon: Map },
  { label: "Entities", href: "/entities", icon: Building2 },
  { label: "Compliance", href: "/compliance", icon: Shield },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Sources", href: "/sources", icon: Database },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-3 border-b">
        <Link href="/dashboard" className="flex items-center">
          <div className="rounded-md bg-white border border-border/40 shadow-sm px-3 py-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hopae_logo_cropped.svg" alt="Hopae" className="h-6 w-auto" />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={pathname.startsWith(item.href)}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
