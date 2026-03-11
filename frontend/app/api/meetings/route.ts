import { NextResponse } from "next/server";
import { backendJson } from "@/lib/api";

export async function GET() {
  try {
    const data = await backendJson("/api/meetings");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch meetings";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
