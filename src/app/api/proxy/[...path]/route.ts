import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API = process.env.API_URL ?? "http://localhost:3000/api";

async function handle(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const session = await auth();
  const token = (session as any)?.accessToken;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = `${API}/${path.join("/")}${req.nextUrl.search}`;
  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
