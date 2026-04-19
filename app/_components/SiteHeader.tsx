"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthCta } from "./AuthCta";

const nav = [
  { href: "/reports", label: "レポート一覧" },
  { href: "/purchase", label: "閲覧権購入" },
  { href: "/questions", label: "過去質問集" },
  { href: "/submit", label: "投稿" },
];

const mobileMenuLinks = [
  { href: "/questions", label: "過去質問集" },
  { href: "/submit", label: "投稿" },
  { href: "/login", label: "ログイン" },
  { href: "/signup", label: "無料登録" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--color-background)]/80 backdrop-blur">
      <div className="relative z-50 mx-auto flex w-full max-w-6xl items-center gap-1.5 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 ring-1 ring-[color:var(--color-accent)]/35">
            <span className="font-semibold tracking-tight text-[color:var(--color-accent)]">
              M
            </span>
          </div>
          <span className="truncate whitespace-nowrap text-sm font-semibold tracking-tight sm:text-xl md:text-3xl">
            Medhack
          </span>
        </Link>

        <nav
          aria-label="メインメニュー"
          className="hidden min-h-10 min-w-0 flex-1 flex-nowrap items-center justify-end gap-x-1 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-2 md:flex md:gap-x-5 [&::-webkit-scrollbar]:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] md:text-sm"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="shrink-0 whitespace-nowrap text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] md:text-sm"
          >
            ログイン
          </Link>
        </nav>

        <div className="min-w-0 flex-1 md:hidden" aria-hidden />

        <div className="flex shrink-0 items-center pl-0.5 sm:pl-1">
          <AuthCta />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xl leading-none text-[color:var(--color-foreground)] transition hover:bg-white/10 md:hidden"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          aria-controls="site-header-mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="site-header-mobile-menu"
            aria-label="モバイルメニュー"
            className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-[color:var(--color-background)]/95 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col">
              {mobileMenuLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-base font-medium text-[color:var(--color-foreground)] transition hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
