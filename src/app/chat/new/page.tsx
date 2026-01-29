"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  category: "pubg" | "free-fire" | "topup";
  title: string;
  price: number;
  description: string;
  image?: string;
};

export default function NewChatPage() {
  return (
    <Suspense fallback={<div className="mx-auto grid max-w-2xl gap-6" />}>
      <NewChatPageInner />
    </Suspense>
  );
}

function NewChatPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const initialProductId = useMemo(() => params.get("productId") || "", [params]);

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState(initialProductId);

  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProductTitle = useMemo(() => {
    const p = products.find((x) => x.id === productId);
    return p ? p.title : "";
  }, [products, productId]);

  useEffect(() => {
    setProductId(initialProductId);
  }, [initialProductId]);

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Product[];
      setProducts(data);

      setProductId((current) => {
        if (current && data.some((p) => p.id === current)) return current;
        return data[0]?.id || "";
      });
    }

    void loadProducts();
  }, []);

  async function createChat() {
    if (!productId) {
      setError("اختر المنتج أولاً.");
      return;
    }
    if (!customerName.trim()) {
      setError("اكتب اسمك.");
      return;
    }
    if (whatsapp.trim() && whatsapp.trim().length < 6) {
      setError("رقم واتساب غير صحيح.");
      return;
    }
    if (!text.trim()) {
      setError("اكتب رسالتك.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, customerName, whatsapp: whatsapp.trim() ? whatsapp : undefined, text }),
    });

    setLoading(false);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      setError(`تعذر إنشاء المحادثة (${res.status}). ${txt || "تحقق من البيانات وحاول مرة أخرى."}`);
      return;
    }

    const data = (await res.json()) as { id: string };
    const target = `/chat/${encodeURIComponent(data.id)}`;
    router.push(target);
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== target) {
        window.location.href = target;
      }
    }, 200);
  }

  const canSubmit =
    productId &&
    customerName.trim().length >= 1 &&
    (whatsapp.trim().length === 0 || whatsapp.trim().length >= 6) &&
    text.trim().length >= 1;

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">بدء محادثة مع الأدمن</h1>
        <p className="subtitle">اكتب معلوماتك ورسالتك وسيتم فتح محادثة مباشرة.</p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">اختر المنتج</span>
            <select
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={products.length === 0}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-950">
                  {p.title} — {p.category}
                </option>
              ))}
            </select>
            <div className="text-xs font-bold text-white/50">
              {selectedProductTitle ? `المنتج المختار: ${selectedProductTitle}` : ""}
            </div>
            {products.length === 0 ? (
              <div className="text-xs font-bold text-rose-200">لا توجد منتجات حالياً. أضف منتجات من لوحة الأدمن أولاً.</div>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">اسمك</span>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="مثال: محمد"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">رقم واتساب</span>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="مثال: 213xxxxxxxxx"
              inputMode="tel"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">رسالتك</span>
            <textarea
              className="min-h-[130px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-indigo-400/50"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب ماذا تريد بالضبط (مثال: أريد شراء المنتج، هل متوفر؟)"
            />
          </label>

          {error ? <div className="text-sm font-bold text-rose-300">{error}</div> : null}

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary h-12" type="button" onClick={() => void createChat()} disabled={loading}>
              {loading ? "..." : "بدء المحادثة"}
            </button>
            <a className="btn-secondary" href="/">رجوع</a>
          </div>
        </div>
      </section>
    </div>
  );
}
