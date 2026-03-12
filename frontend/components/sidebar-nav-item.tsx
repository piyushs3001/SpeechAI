"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface SidebarNavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
}

export function SidebarNavItem({ href, icon, label }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {label}
    </Link>
  );
}
