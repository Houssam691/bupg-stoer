import { promises as fs } from "fs";
import path from "path";
import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";

export type ChatMessageFrom = "customer" | "admin";

export type ChatMessage = {
  id: string;
  from: ChatMessageFrom;
  text: string;
  createdAt: string;
};

export type ChatProductSnapshot = {
  id: string;
  category: "pubg" | "free-fire" | "topup";
  title: string;
  price: number;
  description: string;
  image?: string;
};

export type Chat = {
  id: string;
  productId: string;
  productTitle?: string;
  product?: ChatProductSnapshot;
  customerName: string;
  whatsapp?: string;
  createdAt: string;
  messages: ChatMessage[];
};

function getChatsFilePath() {
  return path.join(process.cwd(), "data", "chats.json");
}

function canUseKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function canUseUpstash() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function isVercel() {
  return process.env.VERCEL === "1";
}

const KV_CHATS_KEY = "bupg:chats";

const upstash = canUseUpstash()
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

export async function readChats(): Promise<Chat[]> {
  if (isVercel() && !canUseKv() && !canUseUpstash()) {
    return [];
  }

  if (upstash) {
    const data = (await upstash.get(KV_CHATS_KEY)) as unknown;
    return Array.isArray(data) ? (data as Chat[]) : [];
  }
  if (canUseKv()) {
    const data = (await kv.get(KV_CHATS_KEY)) as unknown;
    return Array.isArray(data) ? (data as Chat[]) : [];
  }
  const filePath = getChatsFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Chat[]) : [];
  } catch {
    return [];
  }
}

export async function readChatsResult(): Promise<{ ok: true; chats: Chat[] } | { ok: false; chats: [] }> {
  if (isVercel() && !canUseKv() && !canUseUpstash()) {
    return { ok: false, chats: [] };
  }

  if (upstash) {
    const data = (await upstash.get(KV_CHATS_KEY)) as unknown;
    return { ok: true, chats: Array.isArray(data) ? (data as Chat[]) : [] };
  }
  if (canUseKv()) {
    const data = (await kv.get(KV_CHATS_KEY)) as unknown;
    return { ok: true, chats: Array.isArray(data) ? (data as Chat[]) : [] };
  }
  const filePath = getChatsFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return { ok: true, chats: Array.isArray(parsed) ? (parsed as Chat[]) : [] };
  } catch {
    return { ok: false, chats: [] };
  }
}

export async function writeChats(nextChats: Chat[]): Promise<void> {
  if (isVercel() && !canUseKv() && !canUseUpstash()) {
    throw new Error(
      "Persistent storage is not configured on Vercel. Please set either (KV_REST_API_URL, KV_REST_API_TOKEN) or (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) in Vercel Environment Variables."
    );
  }

  if (upstash) {
    await upstash.set(KV_CHATS_KEY, nextChats);
    return;
  }
  if (canUseKv()) {
    await kv.set(KV_CHATS_KEY, nextChats);
    return;
  }
  const filePath = getChatsFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(nextChats, null, 2), "utf8");
  try {
    await fs.rename(tmpPath, filePath);
  } catch {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
    await fs.rename(tmpPath, filePath);
  }
}

export function generateChatId() {
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateMessageId() {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
