import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API = process.env.API_URL ?? "http://localhost:3000/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const session = await auth();
  const token = (session as any)?.accessToken;

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = `${API}/${path.join("/")}${req.nextUrl.search}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
