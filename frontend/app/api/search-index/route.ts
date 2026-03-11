import { NextRequest, NextResponse } from "next/server";
import { backendJson } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams.toString();
    const path = searchParams ? `/api/search-index?${searchParams}` : "/api/search-index";
    const data = await backendJson(path);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
