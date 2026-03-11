import { NextRequest, NextResponse } from "next/server";
import { backendJson } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await backendJson(`/api/jobs/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch job";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
