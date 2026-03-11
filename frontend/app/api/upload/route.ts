import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await backendFetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
