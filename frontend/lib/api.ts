import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function getTokens(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  const session = await getServerSession(authOptions);
  const s = session as Record<string, unknown> | null;
  return {
    accessToken: s?.accessToken as string | undefined,
    refreshToken: s?.refreshToken as string | undefined,
  };
}

export async function getAccessToken(): Promise<string | undefined> {
  const { accessToken } = await getTokens();
  return accessToken;
}

export async function backendFetch(path: string, init?: RequestInit) {
  const { accessToken, refreshToken } = await getTokens();
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (refreshToken) {
    headers.set("X-Refresh-Token", refreshToken);
  }
  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }
  return res;
}

export async function backendJson(path: string, init?: RequestInit) {
  const res = await backendFetch(path, init);
  return res.json();
}
