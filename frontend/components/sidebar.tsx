"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Mic,
  Upload,
  Search,
  Settings,
  FolderOpen,
  Plus,
  X,
  LogOut,
} from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useAppStore } from "@/lib/store";

const PRESET_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
];

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { href: "/recorder", icon: <Mic size={18} />, label: "New Recording" },
  { href: "/upload", icon: <Upload size={18} />, label: "Upload File" },
  { href: "/search", icon: <Search size={18} />, label: "Search" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const folders = useAppStore((s) => s.folders);
  const fetchFolders = useAppStore((s) => s.fetchFolders);
  const addFolder = useAppStore((s) => s.addFolder);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  async function handleCreateFolder() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addFolder(newName.trim(), newColor);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setShowNewFolder(false);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  function handleCancelNewFolder() {
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    setShowNewFolder(false);
  }

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
      <nav className="flex flex-1 flex-col overflow-y-auto px-3">
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
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-gray-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Folders
              </span>
            </div>
            <button
              onClick={() => setShowNewFolder((v) => !v)}
              className="flex h-5 w-5 items-center justify-center rounded text-gray-500 transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
              title="New folder"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Inline new-folder form */}
          {showNewFolder && (
            <div className="mx-2 mb-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Folder name"
                className="mb-2 w-full rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2 py-1 text-xs text-white placeholder-gray-600 outline-none focus:border-[#64b5f6]/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") handleCancelNewFolder();
                }}
                autoFocus
              />
              <div className="mb-2 flex items-center gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="h-4 w-4 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline:
                        newColor === color
                          ? `2px solid ${color}`
                          : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCreateFolder}
                  disabled={!newName.trim() || creating}
                  className="flex-1 rounded bg-[#64b5f6] px-2 py-1 text-xs font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80 disabled:opacity-50"
                >
                  {creating ? "…" : "Create"}
                </button>
                <button
                  onClick={handleCancelNewFolder}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Folder list */}
          <div className="flex flex-col gap-0.5">
            {folders.length === 0 && !showNewFolder ? (
              <p className="px-3 py-2 text-xs text-gray-600">No folders yet</p>
            ) : (
              folders.map((folder) => {
                const href = `/folders/${folder.id}`;
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={folder.id}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-l-2 border-[#64b5f6] bg-[rgba(100,181,246,0.1)] text-[#64b5f6]"
                        : "text-gray-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate text-sm">{folder.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info */}
        {session?.user && (
          <div className="mb-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 mx-1">
            <div className="flex items-center gap-2 min-w-0">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#64b5f6] text-xs font-bold text-[#0f0f1a]">
                  {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {session.user.name && (
                  <p className="truncate text-xs font-medium text-white leading-tight">
                    {session.user.name}
                  </p>
                )}
                {session.user.email && (
                  <p className="truncate text-[10px] text-gray-500 leading-tight">
                    {session.user.email}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  import("next-auth/react").then(({ signOut }) =>
                    signOut({ callbackUrl: "/login" })
                  )
                }
                className="shrink-0 text-gray-500 transition-colors hover:text-gray-300"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        )}

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
