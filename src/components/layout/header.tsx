"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="flex h-14 items-center border-b px-4 gap-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="text-sm font-medium">Hopae Entity Management</div>
    </header>
  );
}
