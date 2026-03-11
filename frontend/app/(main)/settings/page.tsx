"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Users } from "lucide-react";

interface Settings {
  whisper_model: string;
  openai_api_key: string;
  anthropic_api_key: string;
  google_drive_folder_id: string;
}

const WHISPER_MODELS = [
  { value: "tiny", label: "Tiny", ram: "~1 GB RAM" },
  { value: "base", label: "Base", ram: "~1 GB RAM" },
  { value: "small", label: "Small", ram: "~2 GB RAM" },
  { value: "medium", label: "Medium", ram: "~5 GB RAM" },
  { value: "large-v3", label: "Large v3", ram: "~10 GB RAM" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    whisper_model: "base",
    openai_api_key: "",
    anthropic_api_key: "",
    google_drive_folder_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        // use defaults
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-[#64b5f6]" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <Link
          href="/settings/team"
          className="inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.12)]"
        >
          <Users size={16} />
          Team
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        {/* Whisper Model */}
        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
          <h2 className="mb-4 text-base font-medium text-white">
            Whisper Model
          </h2>
          <select
            value={settings.whisper_model}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whisper_model: e.target.value }))
            }
            className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white outline-none focus:border-[#64b5f6]/50"
          >
            {WHISPER_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} ({m.ram})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Larger models are more accurate but require more RAM and processing time.
          </p>
        </section>

        {/* AI Enhancement */}
        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
          <h2 className="mb-4 text-base font-medium text-white">
            AI Enhancement
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openai_api_key}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, openai_api_key: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#64b5f6]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={settings.anthropic_api_key}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    anthropic_api_key: e.target.value,
                  }))
                }
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#64b5f6]/50"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            API keys are used for AI-powered summaries and action item extraction.
          </p>
        </section>

        {/* Google Drive */}
        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-5">
          <h2 className="mb-4 text-base font-medium text-white">
            Google Drive
          </h2>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Folder ID
            </label>
            <input
              type="text"
              value={settings.google_drive_folder_id}
              readOnly
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-gray-400 outline-none cursor-default"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This is the Google Drive folder where audio files and transcripts are stored.
          </p>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#64b5f6] px-5 py-2.5 text-sm font-medium text-[#0f0f1a] transition-colors hover:bg-[#64b5f6]/80 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-400">Settings saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
