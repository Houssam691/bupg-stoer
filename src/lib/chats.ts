import { promises as fs } from "fs";
import path from "path";

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

export async function readChats(): Promise<Chat[]> {
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
