import Image from "next/image";
import { readProducts } from "@/lib/products";

export default async function FreeFirePage() {
  const products = (await readProducts()).filter((p) => p.category === "free-fire");

  return (
    <div className="grid gap-6">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">حسابات Free Fire</h1>
        <p className="subtitle">حسابات نادرة وعروض مميزة — اختر ما يناسبك.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="glass glass-hover overflow-hidden rounded-3xl">
            <div className="relative aspect-[16/10]">
              <Image src={p.image || "/uploads/placeholder.svg"} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-5">
              <div className="text-lg font-black">{p.title}</div>
              <div className="mt-2 text-sm leading-7 text-white/70">{p.description}</div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xl font-black text-white">{p.price} دج</div>
                <a className="btn-primary w-full sm:w-auto" href={`/chat/new?productId=${encodeURIComponent(p.id)}`}>شراء</a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
