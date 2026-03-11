"use client";

import {
  LayoutDashboard,
  Mic,
  Upload,
  Search,
  Settings,
  FolderOpen,
} from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { href: "/recorder", icon: <Mic size={18} />, label: "New Recording" },
  { href: "/upload", icon: <Upload size={18} />, label: "Upload File" },
  { href: "/search", icon: <Search size={18} />, label: "Search" },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-[#161625] border-r border-[rgba(255,255,255,0.08)]">
      {/* Logo & App Name */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#64b5f6] text-sm font-bold text-[#0f0f1a]">
          S
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">SpeechAI</h1>
          <p className="text-xs text-gray-500">Local Transcription</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>

        {/* Folders Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 px-3 py-2">
            <FolderOpen size={14} className="text-gray-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Folders
            </span>
          </div>
          {/* Folders loaded from Zustand store in Task 23 */}
          <p className="px-3 py-2 text-xs text-gray-600">No folders yet</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <div className="mb-4">
          <SidebarNavItem
            href="/settings"
            icon={<Settings size={18} />}
            label="Settings"
          />
        </div>
      </nav>
    </aside>
  );
}
