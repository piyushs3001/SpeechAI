import { NextRequest, NextResponse } from "next/server";
import { backendJson } from "@/lib/api";

export async function GET() {
  try {
    const data = await backendJson("/api/folders");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch folders";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendJson("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create folder";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
