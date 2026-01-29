import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { generateChatId, generateMessageId, readChatsResult, writeChats } from "@/lib/chats";
import { readProducts } from "@/lib/products";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json([]);
  }

  const chats = result.chats;
  const sorted = [...chats].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    productId?: string;
    customerName?: string;
    whatsapp?: string;
    text?: string;
  };

  if (!body?.productId || !body.customerName || !body.text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const result = await readChatsResult();
  const chats = result.ok ? result.chats : [];

  let productTitle: string | undefined;
  let product:
    | {
        id: string;
        category: "pubg" | "free-fire" | "topup";
        title: string;
        price: number;
        description: string;
        image?: string;
      }
    | undefined;
  try {
    const products = await readProducts();
    const p = products.find((x) => x.id === body.productId);
    productTitle = p?.title;
    if (p) {
      product = {
        id: p.id,
        category: p.category,
        title: p.title,
        price: p.price,
        description: p.description,
        image: p.image,
      };
    }
  } catch {
    // ignore
  }

  const chatId = generateChatId();
  const msgId = generateMessageId();

  chats.unshift({
    id: chatId,
    productId: body.productId,
    productTitle,
    product,
    customerName: body.customerName,
    whatsapp: body.whatsapp,
    createdAt: now,
    messages: [
      {
        id: msgId,
        from: "customer",
        text: body.text,
        createdAt: now,
      },
    ],
  });

  await writeChats(chats);

  return NextResponse.json({ id: chatId });
}
