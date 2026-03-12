"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] text-lg font-bold text-white">
            S
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-[#111827] mb-2">SpeechAI</h1>
        <p className="text-[15px] text-[#6b7280] mb-10">Local Meeting Transcription</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-[#2563eb] text-white px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
