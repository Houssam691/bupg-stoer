import { NextResponse } from "next/server";
import { readProducts, writeProducts, type Product } from "@/lib/products";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Product>;

  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  products[idx] = {
    ...products[idx],
    ...body,
    id: products[idx].id,
  };

  await writeProducts(products);
  return NextResponse.json(products[idx]);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const products = await readProducts();
  const next = products.filter((p) => p.id !== id);
  await writeProducts(next);

  return NextResponse.json({ ok: true });
}
