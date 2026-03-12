import { NextRequest } from "next/server";
import { getTokens } from "@/lib/api";

const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export const maxDuration = 600; // 10 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { accessToken, refreshToken } = await getTokens();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if (refreshToken) {
      headers["X-Refresh-Token"] = refreshToken;
    }

    const res = await fetch(`${BACKEND_URL}/api/jobs/${id}/stream`, {
      headers,
      signal: AbortSignal.timeout(600_000), // 10 min timeout
    });

    if (!res.ok || !res.body) {
      return new Response(JSON.stringify({ error: `Backend error: ${res.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
