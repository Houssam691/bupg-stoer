"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("كلمة المرور غير صحيحة");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-lg">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">تسجيل دخول الأدمن</h1>
        <p className="subtitle">أدخل كلمة المرور للوصول إلى لوحة التحكم.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">كلمة المرور</span>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? <div className="text-sm font-bold text-rose-300">{error}</div> : null}

          <button className="btn-primary h-12 w-full" type="submit" disabled={loading}>
            {loading ? "..." : "دخول"}
          </button>
        </form>
      </section>
    </div>
  );
}
