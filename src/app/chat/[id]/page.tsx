"use client";

import { use, useEffect, useRef, useState } from "react";

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
  customerName: string;
  whatsapp?: string;
  createdAt: string;
  messages: ChatMessage[];
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = use(params);

  const [chat, setChat] = useState<Chat | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, { cache: "no-store" });
    if (!res.ok) {
      setLoadError(res.status === 404 ? "لم يتم العثور على المحادثة." : "تعذر تحميل المحادثة."
      );
      return;
    }
    const data = (await res.json()) as Chat;
    setChat(data);
    setLoadError(null);
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      void load();
    }, 2500);
    return () => clearInterval(t);
  }, [chatId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat?.id, chat?.messages.length]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);

    const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: "customer", text }),
    });

    setSending(false);

    if (res.ok) {
      setText("");
      await load();
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <section className="glass rounded-3xl p-6 md:p-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="title">المحادثة</h1>
            <p className="subtitle">سيقوم الأدمن بالرد عليك هنا.</p>
          </div>
          <a className="btn-secondary" href="/">الرئيسية</a>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-bold text-white/60">المحادثة: {chatId}</div>
            <div className="mt-1 text-xs font-bold text-white/60">المنتج: {chat?.productId || "..."}</div>
            <div className="mt-1 text-xs font-bold text-white/60">الاسم: {chat?.customerName || "..."}</div>
            <div className="mt-1 text-xs font-bold text-white/60">واتساب: {chat?.whatsapp || "..."}</div>
          </div>

          <div className="grid gap-2">
            <div ref={scrollRef} className="h-[420px] overflow-y-auto glass rounded-3xl p-4">
              <div className="grid gap-3">
                {(chat?.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.from === "customer"
                        ? "max-w-[85%] rounded-2xl bg-indigo-500/20 p-3 text-white/90"
                        : "max-w-[85%] justify-self-end rounded-2xl bg-emerald-500/20 p-3 text-white/90"
                    }
                  >
                    <div className="text-sm leading-7">{m.text}</div>
                    <div className="mt-1 text-xs font-bold text-white/50">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}

                {!chat ? <div className="text-sm text-white/70">جاري تحميل المحادثة...</div> : null}
                {loadError ? <div className="text-sm font-bold text-rose-200">{loadError}</div> : null}
                {chat && chat.messages.length === 0 ? <div className="text-sm text-white/70">لا توجد رسائل بعد.</div> : null}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب رسالة..."
              />
              <button className="btn-primary h-12" type="button" onClick={() => void send()} disabled={sending || !text.trim()}>
                {sending ? "..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
