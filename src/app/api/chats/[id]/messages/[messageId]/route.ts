import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { readChatsResult, writeChats } from "@/lib/chats";

export const runtime = "nodejs";

async function getParams(ctx: { params: { id: string; messageId: string } | Promise<{ id: string; messageId: string }> }) {
  const maybePromise = ctx.params as unknown as { then?: unknown };
  const resolved =
    typeof maybePromise?.then === "function"
      ? await (ctx.params as Promise<{ id: string; messageId: string }>)
      : (ctx.params as { id: string; messageId: string });
  return resolved;
}

export async function DELETE(_req: Request, ctx: { params: { id: string; messageId: string } | Promise<{ id: string; messageId: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await getParams(ctx);

  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  const chats = result.chats;
  const chatIdx = chats.findIndex((c) => c.id === id);
  if (chatIdx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chat = chats[chatIdx];
  const nextMessages = chat.messages.filter((m) => m.id !== messageId);
  if (nextMessages.length === chat.messages.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextChats = [...chats];
  nextChats[chatIdx] = { ...chat, messages: nextMessages };
  await writeChats(nextChats);

  return NextResponse.json({ ok: true });
}
