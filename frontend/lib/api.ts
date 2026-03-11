const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function backendFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }
  return res;
}

export async function backendJson(path: string, init?: RequestInit) {
  const res = await backendFetch(path, init);
  return res.json();
}
