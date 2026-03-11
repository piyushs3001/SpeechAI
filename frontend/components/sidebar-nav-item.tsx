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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-l-2 border-[#64b5f6] bg-[rgba(100,181,246,0.1)] text-[#64b5f6]"
          : "text-gray-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {label}
    </Link>
  );
}
