import { promises as fs } from "fs";
import path from "path";

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

export async function readProducts(): Promise<Product[]> {
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
