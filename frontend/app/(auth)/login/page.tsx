"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb] text-lg font-bold text-white">
            S
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-white mb-2">SpeechAI</h1>
        <p className="text-[15px] text-gray-500 mb-10">Local Meeting Transcription</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-white text-gray-900 px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
