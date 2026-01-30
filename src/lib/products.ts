import { promises as fs } from "fs";
import path from "path";
import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";

export type ProductCategory = "pubg" | "free-fire" | "topup";

export type Product = {
  id: string;
  category: ProductCategory;
  title: string;
  price: number;
  description: string;
  image?: string;
};

function getProductsFilePath() {
  return path.join(process.cwd(), "data", "products.json");
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

const KV_PRODUCTS_KEY = "bupg:products";

const upstash = canUseUpstash()
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

export async function readProducts(): Promise<Product[]> {
  if (isVercel() && !canUseKv() && !canUseUpstash()) {
    return [];
  }

  if (upstash) {
    const data = (await upstash.get(KV_PRODUCTS_KEY)) as unknown;
    return Array.isArray(data) ? (data as Product[]) : [];
  }
  if (canUseKv()) {
    const data = (await kv.get(KV_PRODUCTS_KEY)) as unknown;
    return Array.isArray(data) ? (data as Product[]) : [];
  }
  const filePath = getProductsFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export async function writeProducts(nextProducts: Product[]): Promise<void> {
  if (isVercel() && !canUseKv() && !canUseUpstash()) {
    throw new Error(
      "Persistent storage is not configured on Vercel. Please set either (KV_REST_API_URL, KV_REST_API_TOKEN) or (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) in Vercel Environment Variables."
    );
  }

  if (upstash) {
    await upstash.set(KV_PRODUCTS_KEY, nextProducts);
    return;
  }
  if (canUseKv()) {
    await kv.set(KV_PRODUCTS_KEY, nextProducts);
    return;
  }
  const filePath = getProductsFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(nextProducts, null, 2), "utf8");
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

export function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
