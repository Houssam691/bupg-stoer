import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "متجر الألعاب",
  description: "متجر حسابات الألعاب وخدمات الشحن",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
              <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
                <span className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 shadow-[0_10px_30px_rgba(2,6,23,0.18)]" />
                <span>متجر الألعاب</span>
              </Link>

              <nav className="hidden items-center gap-2 md:flex" aria-label="التنقل الرئيسي">
                <Link href="/pubg" className="rounded-full px-4 py-2 font-bold text-white/80 hover:bg-white/5 hover:text-white">
                  PUBG
                </Link>
                <Link href="/free-fire" className="rounded-full px-4 py-2 font-bold text-white/80 hover:bg-white/5 hover:text-white">
                  Free Fire
                </Link>
                <Link href="/topup" className="rounded-full px-4 py-2 font-bold text-white/80 hover:bg-white/5 hover:text-white">
                  Top-up
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>

          <footer className="border-t border-white/10 py-10 text-white/70">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
              <div>© {new Date().getFullYear()} متجر الألعاب</div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/pubg" className="rounded-full px-4 py-2 hover:bg-white/5">
                  PUBG
                </Link>
                <Link href="/free-fire" className="rounded-full px-4 py-2 hover:bg-white/5">
                  Free Fire
                </Link>
                <Link href="/topup" className="rounded-full px-4 py-2 hover:bg-white/5">
                  Top-up
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
