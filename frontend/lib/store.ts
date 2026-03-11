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
  fetchMeetings: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  addFolder: (name: string, color: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  meetings: [],
  folders: [],
  loading: false,

  fetchMeetings: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      set({ meetings: data.meetings || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchFolders: async () => {
    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      set({ folders: data.folders || [] });
    } catch {
      // silently fail
    }
  },

  addFolder: async (name, color) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const folder = await res.json();
    set((state) => ({ folders: [...state.folders, folder] }));
  },

  deleteFolder: async (id) => {
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },
}));
