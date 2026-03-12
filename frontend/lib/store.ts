import { create } from "zustand";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: string[];
  has_summary: boolean;
  action_item_count: number;
  folder_id: string | null;
  status: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
}

interface AppState {
  meetings: Meeting[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  fetchMeetings: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  addFolder: (name: string, color: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  meetings: [],
  folders: [],
  loading: false,
  error: null,

  fetchMeetings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/meetings");
      if (!res.ok) throw new Error("Failed to load meetings");
      const data = await res.json();
      // Map backend fields to frontend Meeting interface
      const meetings = (data.meetings || []).map(
        (m: Record<string, unknown>) => ({
          id: m.meeting_id || m.id,
          title: m.title || "Untitled",
          date: m.created_at || m.date || "",
          duration: m.duration || 0,
          speakers: m.speakers
            ? Array.isArray(m.speakers)
              ? m.speakers
              : Object.values(m.speakers)
            : [],
          has_summary: !!m.summary || !!m.has_summary,
          action_item_count: m.action_item_count || 0,
          folder_id: m.folder || m.folder_id || null,
          status: m.status || "complete",
        })
      );
      set({ meetings, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load meetings",
      });
    }
  },

  fetchFolders: async () => {
    try {
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Failed to load folders");
      const data = await res.json();
      set({ folders: data.folders || [] });
    } catch {
      // folders are secondary data; silently fail
    }
  },

  addFolder: async (name, color) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error("Failed to create folder");
    const folder = await res.json();
    set((state) => ({ folders: [...state.folders, folder] }));
  },

  deleteFolder: async (id) => {
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete folder");
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },
}));
