import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { generateMessageId, readChatsResult, writeChats } from "@/lib/chats";

export const runtime = "nodejs";

async function getChatId(ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const maybePromise = ctx.params as unknown as { then?: unknown };
  const resolved = typeof maybePromise?.then === "function" ? await (ctx.params as Promise<{ id: string }>) : (ctx.params as { id: string });
  return resolved.id;
}

export async function GET(_req: Request, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const id = await getChatId(ctx);
  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
  const chats = result.chats;
  const chat = chats.find((c) => c.id === id);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(chat);
}

export async function POST(req: Request, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const id = await getChatId(ctx);

  const body = (await req.json().catch(() => null)) as null | {
    from?: "customer" | "admin";
    text?: string;
  };

  if (!body?.from || !body.text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (body.from === "admin" && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
  const chats = result.chats;
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const msgId = generateMessageId();

  const next = { ...chats[idx] };
  next.messages = [
    ...next.messages,
    {
      id: msgId,
      from: body.from,
      text: body.text,
      createdAt: now,
    },
  ];

  const nextChats = [...chats];
  nextChats[idx] = next;

  await writeChats(nextChats);

  return NextResponse.json(next);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await getChatId(ctx);

  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  const chats = result.chats;
  const nextChats = chats.filter((c) => c.id !== id);
  if (nextChats.length === chats.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeChats(nextChats);
  return NextResponse.json({ ok: true });
}
