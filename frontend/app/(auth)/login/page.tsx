"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">SpeechAI</h1>
        <p className="text-gray-400 mb-8">Local Meeting Transcription</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
