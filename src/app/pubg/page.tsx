import Image from "next/image";
import { readProducts } from "@/lib/products";

export default async function PubgPage() {
  const products = (await readProducts()).filter((p) => p.category === "pubg");

  return (
    <div className="grid gap-6">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">حسابات PUBG Mobile</h1>
        <p className="subtitle">اختر حسابك المناسب. جميع العروض قابلة للتعديل من لوحة الإدارة.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="glass glass-hover overflow-hidden rounded-3xl">
            <div className="relative aspect-[16/10]">
              <Image src={p.image || "/uploads/placeholder.svg"} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-5">
              <div className="text-lg font-black">{p.title}</div>
              <div className="mt-2 text-sm leading-7 text-white/70">{p.description}</div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xl font-black text-white">{p.price} دج</div>
                <a className="btn-primary" href={`/chat/new?productId=${encodeURIComponent(p.id)}`}>شراء</a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
