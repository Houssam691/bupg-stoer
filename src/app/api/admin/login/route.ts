import { NextResponse } from "next/server";
import { getAdminPassword, setAdminCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { password?: string };

  if ((body.password || "").trim() !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
