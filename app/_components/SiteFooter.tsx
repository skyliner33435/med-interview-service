export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-[color:var(--color-muted)] md:flex-row md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} Medhack</div>
        <div className="flex gap-5">
          <a className="hover:text-[color:var(--color-foreground)]" href="#">
            利用規約
          </a>
          <a className="hover:text-[color:var(--color-foreground)]" href="#">
            プライバシー
          </a>
          <a className="hover:text-[color:var(--color-foreground)]" href="#">
            お問い合わせ
          </a>
        </div>
      </div>
    </footer>
  );
}

