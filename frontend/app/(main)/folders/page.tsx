"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

const PRESET_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
];

export default function FoldersPage() {
  const folders = useAppStore((s) => s.folders);
  const meetings = useAppStore((s) => s.meetings);
  const fetchFolders = useAppStore((s) => s.fetchFolders);
  const fetchMeetings = useAppStore((s) => s.fetchMeetings);
  const addFolder = useAppStore((s) => s.addFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchMeetings();
  }, [fetchFolders, fetchMeetings]);

  function getMeetingCount(folderId: string): number {
    return meetings.filter((m) => m.folder_id === folderId).length;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addFolder(newName.trim(), newColor);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete folder "${name}"? Meetings will not be deleted.`)) return;
    await deleteFolder(id);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Folders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#64b5f6] px-4 py-2 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80"
        >
          <Plus size={16} />
          New Folder
        </button>
      </div>

      {/* Create folder form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Folder name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Project Alpha"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#64b5f6]/50"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Color
              </label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="h-7 w-7 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      outline:
                        newColor === color
                          ? `2px solid ${color}`
                          : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="rounded-lg bg-[#64b5f6] px-4 py-2 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Folders list */}
      {folders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FolderOpen size={40} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-500">
              No folders yet. Create one to organize your meetings.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {folders.map((folder) => {
            const count = getMeetingCount(folder.id);
            return (
              <div
                key={folder.id}
                className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.07)]"
              >
                <Link
                  href={`/folders/${folder.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="text-sm font-medium text-white truncate">
                    {folder.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {count} meeting{count !== 1 ? "s" : ""}
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(folder.id, folder.name)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
