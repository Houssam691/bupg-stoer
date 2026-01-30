"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type ProductCategory = "pubg" | "free-fire" | "topup";

type Product = {
  id: string;
  category: ProductCategory;
  title: string;
  price: number;
  description: string;
  image?: string;
};

type ChatMessageFrom = "customer" | "admin";

type ChatMessage = {
  id: string;
  from: ChatMessageFrom;
  text: string;
  createdAt: string;
};

type Chat = {
  id: string;
  productId: string;
  productTitle?: string;
  product?: {
    id: string;
    category: ProductCategory;
    title: string;
    price: number;
    description: string;
    image?: string;
  };
  customerName: string;
  whatsapp?: string;
  createdAt: string;
  messages: ChatMessage[];
};

const categories: { value: ProductCategory; label: string }[] = [
  { value: "pubg", label: "PUBG" },
  { value: "free-fire", label: "Free Fire" },
  { value: "topup", label: "Top-up" },
];

export default function AdminApp() {
  const [items, setItems] = useState<Product[]>([]);
  const [active, setActive] = useState<ProductCategory>("pubg");
  const [saving, setSaving] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [createError, setCreateError] = useState<string | null>(null);
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductDescription, setNewProductDescription] = useState<string>("");

  const [newProductImage, setNewProductImage] = useState<File | null>(null);

  const [view, setView] = useState<"products" | "chats">("products");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const activeChatIdRef = useRef<string | null>(null);
  const chatsScrollRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => items.filter((p) => p.category === active), [items, active]);
  const productTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of items) m.set(p.id, p.title);
    return m;
  }, [items]);
  const activeChat = useMemo(
    () => (activeChatId ? chats.find((c) => c.id === activeChatId) || null : null),
    [activeChatId, chats]
  );

  const activeChatProduct = useMemo(() => {
    if (!activeChat) return null;
    if (activeChat.product) return activeChat.product;
    const p = items.find((x) => x.id === activeChat.productId);
    return p || null;
  }, [activeChat, items]);

  async function load() {
    try {
      setLoadError(null);
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setLoadError(`تعذر تحميل المنتجات (${res.status}). ${txt || "تحقق من إعدادات التخزين على Vercel."}`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as Product[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setLoadError("تعذر تحميل المنتجات. تحقق من الاتصال أو Logs في Vercel.");
      setItems([]);
    }
  }

  async function deleteMessage(chatId: string, messageId: string) {
    setDeletingMessageId(messageId);
    const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
    });
    setDeletingMessageId(null);
    if (res.ok) {
      await loadChats();
    }
  }

  async function deleteChat(chatId: string) {
    setDeletingChatId(chatId);
    const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, { method: "DELETE" });
    setDeletingChatId(null);
    if (res.ok) {
      setActiveChatId((current) => (current === chatId ? null : current));
      await loadChats();
    }
  }

  async function loadChats() {
    let nextChats: Chat[] = [];
    try {
      const res = await fetch("/api/chats", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Chat[];
      nextChats = Array.isArray(data) ? data : [];
      setChats(nextChats);
    } catch {
      // ignore
    }
    const current = activeChatIdRef.current;
    if (current && nextChats.some((c) => c.id === current)) {
      return;
    }
    if (!current && nextChats.length > 0) {
      setActiveChatId(nextChats[0].id);
    }
  }

  useEffect(() => {
    void load();
    void loadChats();
    const t = setInterval(() => {
      void loadChats();
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChat) return;
    const el = chatsScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [activeChat?.id, activeChat?.messages.length]);

  async function sendAdminMessage() {
    if (!activeChatId || !adminReply.trim()) return;
    setSendingReply(true);

    const res = await fetch(`/api/chats/${encodeURIComponent(activeChatId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: "admin", text: adminReply }),
    });

    setSendingReply(false);
    if (res.ok) {
      setAdminReply("");
      await loadChats();
    }
  }

  async function create() {
    setCreateError(null);

    if (!newProductImage) {
      setCreateError("اختر صورة للمنتج أولاً.");
      return;
    }

    if (!Number.isFinite(newProductPrice) || newProductPrice < 0) {
      setCreateError("أدخل سعرًا صحيحًا.");
      return;
    }

    if (!newProductDescription.trim()) {
      setCreateError("أدخل وصفًا للمنتج.");
      return;
    }

    let imageUrl = "/uploads/placeholder.svg";
    const fd = new FormData();
    fd.append("file", newProductImage);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => "");
      setCreateError(`تعذر رفع الصورة (${uploadRes.status}). ${txt || ""}`.trim());
      return;
    }

    const uploadData = (await uploadRes.json()) as { url: string };
    imageUrl = uploadData.url;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: active,
        title: "منتج جديد",
        price: newProductPrice,
        description: newProductDescription,
        image: imageUrl,
      }),
    });

    if (res.ok) {
      setNewProductImage(null);
      setNewProductPrice(0);
      setNewProductDescription("");
      await load();
      setCreateError(null);
    } else {
      const txt = await res.text().catch(() => "");
      setCreateError(`تعذر إضافة المنتج (${res.status}). ${txt || ""}`.trim());
    }
  }

  async function save(p: Product) {
    setSaving(p.id);
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    setSaving(null);
    if (res.ok) {
      await load();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    }
  }

  async function uploadImage(file: File, product: Product) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return;

    const data = (await res.json()) as { url: string };
    await save({ ...product, image: data.url });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="glass rounded-3xl p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="grid gap-4">
          <div>
            <div className="text-sm font-black text-white">لوحة الإدارة</div>
            <div className="mt-1 text-xs font-bold text-white/60">إدارة المنتجات والمحادثات</div>
          </div>

          <div className="grid gap-2">
            <button
              className={view === "products" ? "btn-primary w-full" : "btn-secondary w-full"}
              type="button"
              onClick={() => setView("products")}
            >
              المنتجات
            </button>
            <button
              className={view === "chats" ? "btn-primary w-full" : "btn-secondary w-full"}
              type="button"
              onClick={() => setView("chats")}
            >
              المحادثات
            </button>
          </div>

          {view === "products" ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="text-xs font-black text-white/70">الأقسام</div>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      className={c.value === active ? "btn-primary" : "btn-secondary"}
                      onClick={() => setActive(c.value)}
                      type="button"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-xs font-black text-white/70">السعر (دج)</span>
                <input
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                  type="number"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <span className="text-xs font-black text-white/70">الوصف</span>
                <textarea
                  className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-indigo-400/50"
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                />
              </div>

              <label className="inline-flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/10">
                <span>صورة المنتج الجديد</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setNewProductImage(e.target.files?.[0] || null);
                  }}
                />
                <span className="max-w-[120px] truncate text-xs text-white/60">{newProductImage ? newProductImage.name : "اختيار"}</span>
              </label>

              {createError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                  {createError}
                </div>
              ) : null}

              <button className="btn-primary w-full" onClick={create} type="button">
                + إضافة منتج
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs font-bold text-white/60">المنتجات</div>
                  <div className="mt-1 text-lg font-black text-white">{items.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs font-bold text-white/60">في القسم</div>
                  <div className="mt-1 text-lg font-black text-white">{filtered.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <button className="btn-secondary w-full" type="button" onClick={() => void loadChats()}>
                تحديث المحادثات
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-bold text-white/60">عدد المحادثات</div>
                <div className="mt-1 text-lg font-black text-white">{chats.length}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="grid gap-4">
        {loadError ? (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-100">
            {loadError}
          </div>
        ) : null}
        <section className="glass rounded-3xl p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black text-white">{view === "products" ? "المنتجات" : "المحادثات"}</div>
              <div className="mt-1 text-xs font-bold text-white/60">
                {view === "products"
                  ? `القسم الحالي: ${categories.find((x) => x.value === active)?.label || active}`
                  : "متابعة الرسائل والرد على العملاء"}
              </div>
            </div>

            {view === "products" ? (
              <button className="btn-secondary" type="button" onClick={() => void load()}>
                تحديث المنتجات
              </button>
            ) : null}
          </div>
        </section>

        {view === "products" ? (
          <section className="grid gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="glass rounded-3xl p-5">
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <Image src={p.image || "/uploads/placeholder.svg"} alt={p.title} fill className="object-cover" />
                    </div>
                    <label className="mt-3 block">
                      <span className="text-xs font-bold text-white/70">تغيير الصورة</span>
                      <input
                        className="mt-2 block w-full text-sm text-white/70"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(file, p);
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <span className="text-xs font-bold text-white/70">العنوان</span>
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                        value={p.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, title: v } : x)));
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <span className="text-xs font-bold text-white/70">السعر (دج)</span>
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                        type="number"
                        value={p.price}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, price: v } : x)));
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <span className="text-xs font-bold text-white/70">الوصف</span>
                      <textarea
                        className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-indigo-400/50"
                        value={p.description}
                        onChange={(e) => {
                          const v = e.target.value;
                          setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, description: v } : x)));
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary" type="button" onClick={() => void save(p)} disabled={saving === p.id}>
                        {saving === p.id ? "..." : "حفظ"}
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => void remove(p.id)}>
                        حذف
                      </button>
                      <a className="btn-secondary" href={`/${p.category === "free-fire" ? "free-fire" : p.category}`}>
                        عرض الصفحة
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="glass rounded-3xl p-6 text-white/70">لا توجد منتجات في هذا القسم.</div>
            ) : null}
          </section>
        ) : (
          <section className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <div className="glass rounded-3xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">قائمة المحادثات</div>
                    <div className="mt-1 text-xs font-bold text-white/60">اضغط على محادثة لعرضها</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {chats.map((c) => {
                    const last = c.messages[c.messages.length - 1];
                    const productTitle = c.productTitle || productTitleById.get(c.productId);
                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        className={
                          c.id === activeChatId
                            ? "w-full rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-3 text-right"
                            : "w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-right hover:bg-white/10"
                        }
                        onClick={() => setActiveChatId(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveChatId(c.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black text-white">{c.customerName}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-white/60">{new Date(c.createdAt).toLocaleString()}</div>
                            <button
                              className="text-xs font-black text-rose-200 hover:text-rose-100"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void deleteChat(c.id);
                              }}
                              disabled={deletingChatId === c.id}
                            >
                              {deletingChatId === c.id ? "..." : "حذف"}
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 text-xs font-bold text-white/60">المنتج: {productTitle || c.productId}</div>
                        <div className="mt-1 text-xs font-bold text-white/60">واتساب: {c.whatsapp || "—"}</div>
                        <div className="mt-2 line-clamp-2 text-sm text-white/80">{last?.text || ""}</div>
                      </div>
                    );
                  })}

                  {chats.length === 0 ? <div className="text-sm text-white/70">لا توجد محادثات.</div> : null}
                </div>
              </div>

              <div className="glass rounded-3xl p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-sm font-black">المحادثة</div>
                    <div className="mt-1 text-xs font-bold text-white/60">{activeChat ? `#${activeChat.id}` : "اختر محادثة"}</div>
                  </div>
                  <button className="btn-secondary" type="button" onClick={() => void loadChats()}>
                    تحديث
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {activeChat ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs font-bold text-white/60">الاسم: {activeChat.customerName}</div>
                      <div className="mt-1 text-xs font-bold text-white/60">واتساب: {activeChat.whatsapp || "—"}</div>
                      <div className="mt-1 text-xs font-bold text-white/60">
                        المنتج: {activeChat.productTitle || productTitleById.get(activeChat.productId) || activeChat.productId}
                      </div>
                    </div>
                  ) : null}

                  {activeChatProduct ? (
                    <div className="glass rounded-3xl p-4">
                      <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          <Image
                            src={activeChatProduct.image || "/uploads/placeholder.svg"}
                            alt={activeChatProduct.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="grid gap-1">
                          <div className="text-sm font-black text-white">{activeChatProduct.title}</div>
                          <div className="text-xs font-bold text-white/60">السعر: {activeChatProduct.price} دج</div>
                          <div className="text-xs font-bold text-white/60">القسم: {activeChatProduct.category}</div>
                          {activeChatProduct.description ? (
                            <div className="mt-2 line-clamp-3 text-sm leading-7 text-white/80">{activeChatProduct.description}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div ref={chatsScrollRef} className="h-[420px] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-3">
                      {(activeChat?.messages || []).map((m) => (
                        <div key={m.id} className={m.from === "admin" ? "justify-self-end" : ""}>
                          <div
                            className={
                              m.from === "admin"
                                ? "max-w-[85%] rounded-2xl bg-emerald-500/20 p-3 text-white/90"
                                : "max-w-[85%] rounded-2xl bg-indigo-500/20 p-3 text-white/90"
                            }
                          >
                            <div className="text-sm leading-7">{m.text}</div>
                            <div className="mt-1 flex items-center justify-between gap-3">
                              <div className="text-xs font-bold text-white/50">{new Date(m.createdAt).toLocaleString()}</div>
                              <button
                                className="text-xs font-black text-rose-200 hover:text-rose-100"
                                type="button"
                                onClick={() => {
                                  if (!activeChat) return;
                                  void deleteMessage(activeChat.id, m.id);
                                }}
                                disabled={!activeChat || deletingMessageId === m.id}
                              >
                                {deletingMessageId === m.id ? "..." : "حذف"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {activeChat && activeChat.messages.length === 0 ? <div className="text-sm text-white/70">لا توجد رسائل.</div> : null}
                      {!activeChat ? <div className="text-sm text-white/70">اختر محادثة لعرضها.</div> : null}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="اكتب رد الأدمن..."
                      disabled={!activeChat}
                    />
                    <button
                      className="btn-primary h-12"
                      type="button"
                      onClick={() => void sendAdminMessage()}
                      disabled={!activeChat || sendingReply || !adminReply.trim()}
                    >
                      {sendingReply ? "..." : "إرسال"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
