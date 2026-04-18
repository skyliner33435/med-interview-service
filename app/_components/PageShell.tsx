import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)] md:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

