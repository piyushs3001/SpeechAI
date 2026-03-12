import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function getAccessToken(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  const token = (session as Record<string, unknown>)?.accessToken as
    | string
    | undefined;
  if (!token) {
    console.error(
      "[api] No accessToken in session. Session keys:",
      session ? Object.keys(session) : "no session"
    );
  }
  return token;
}

export async function backendFetch(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
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
