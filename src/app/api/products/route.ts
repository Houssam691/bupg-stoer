import { NextResponse } from "next/server";
import { generateId, readProducts, writeProducts, type Product } from "@/lib/products";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

// GET /api/products?category=pubg|free-fire|topup
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const products = await readProducts();
  const filtered = category ? products.filter((p) => p.category === category) : products;
  return NextResponse.json(filtered);
}

// POST /api/products (admin only)
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Product>;

  const next: Product = {
    id: body.id || generateId(body.category || "product"),
    category: (body.category as Product["category"]) || "pubg",
    title: body.title || "منتج جديد",
    price: typeof body.price === "number" ? body.price : 0,
    description: body.description || "",
    image: body.image || "/uploads/placeholder.svg",
  };

  const products = await readProducts();
  products.unshift(next);
  await writeProducts(products);

  return NextResponse.json(next, { status: 201 });
}
