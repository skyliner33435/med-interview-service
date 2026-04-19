import Link from "next/link";
import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";

export default function Home() {
  return (
    <div className="flex-1">
      <SiteHeader />

      <main>
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-white md:py-14">
          <p className="text-xl font-semibold leading-relaxed md:text-2xl">
            筆記は通った。でも、面接で落とされた。
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white md:text-base">
            合格最低点を超えていたのに、なぜ落ちたのか。その答えが、ここにある。
          </p>
        </div>

        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 10%, rgba(201, 168, 76, 0.20), transparent 60%), radial-gradient(700px 420px at 90% 20%, rgba(230, 212, 154, 0.16), transparent 55%)",
            }}
          />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-[color:var(--color-muted)] ring-1 ring-white/10">
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
                大学別に買える 面接「落ちレポート」
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
                面接で落ちた理由を、
                <span className="block font-[family:var(--font-serif)] text-[color:var(--color-accent)]">
                  再現可能な対策
                </span>
                に変える。
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--color-muted)] md:text-lg">
                「何を聞かれて、どう答えて、どこで評価が落ちたのか」——
                受験者の実例を大学別に整理。過去質問は無料で公開、レポートは必要な大学だけ購入できます。
              </p>

              <section className="mt-8 max-w-xl text-left">
                <div className="text-sm font-semibold tracking-tight">
                  創設者の声
                </div>
                <div className="mt-3 rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
                  <blockquote className="relative">
                    <div className="pointer-events-none absolute -left-1 -top-5 select-none font-[family:var(--font-serif)] text-6xl leading-none text-[color:var(--color-accent)]/35">
                      “
                    </div>
                    <p className="text-sm font-semibold leading-7 tracking-tight md:text-base">
                      私は合格最低点より130点高く取りました。
                      <br />
                      それでも、面接で落とされました。
                    </p>
                    <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)] md:text-base">
                      筆記試験は完璧だった。でも結果は不合格。
                      <br />
                      理由は教えてもらえない。何が悪かったのかもわからない。
                      <br />
                      同じ思いをする受験生をなくしたくて、このサービスを作りました。
                    </p>
                  </blockquote>
                </div>
              </section>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/reports"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
                >
                  レポート一覧を見る
                </Link>
                <Link
                  href="/questions"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
                >
                  無料の過去質問集へ
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[color:var(--color-card)] p-4 ring-1 ring-white/10">
                  <div className="text-xs text-[color:var(--color-muted)]">
                    大学別
                  </div>
                  <div className="mt-1 text-sm font-semibold tracking-tight">
                    落ちレポート一覧
                  </div>
                </div>
                <div className="rounded-2xl bg-[color:var(--color-card)] p-4 ring-1 ring-white/10">
                  <div className="text-xs text-[color:var(--color-muted)]">
                    無料
                  </div>
                  <div className="mt-1 text-sm font-semibold tracking-tight">
                    過去質問集（登録不要）
                  </div>
                </div>
                <div className="rounded-2xl bg-[color:var(--color-card)] p-4 ring-1 ring-white/10">
                  <div className="text-xs text-[color:var(--color-muted)]">
                    投稿者特典
                  </div>
                  <div className="mt-1 text-sm font-semibold tracking-tight">
                    全大学レポート閲覧無料
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold tracking-tight">
                    面接落ちレポート（例）
                  </div>
                  <div className="rounded-full bg-[color:var(--color-accent)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/30">
                    大学別 ¥3,000
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    {
                      k: "質問",
                      v: "志望理由／医師像／高校生活で力を入れたこと",
                    },
                    { k: "深掘り", v: "具体例→課題→改善の再現性" },
                    {
                      k: "落ちポイント",
                      v: "結論が曖昧、価値観の一貫性が弱い",
                    },
                    { k: "改善案", v: "結論→根拠→具体→学びの型で統一" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                    >
                      <div className="text-xs text-[color:var(--color-muted)]">
                        {row.k}
                      </div>
                      <div className="mt-1 text-sm leading-6">{row.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0f1b33]/60 p-4 ring-1 ring-white/10">
                  <div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      投稿すると
                    </div>
                    <div className="mt-1 text-sm font-semibold tracking-tight">
                      全大学レポート閲覧が無料に
                    </div>
                  </div>
                  <a
                    href="/submit"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-4 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
                  >
                    レポート投稿
                  </a>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/15 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-16 md:pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "面接落ちレポート",
                desc: "大学別に「落ちた理由」を言語化。深掘りの癖や評価軸を、対策の形に落とし込みます。",
              },
              {
                title: "無料の過去質問集",
                desc: "登録不要で閲覧OK。頻出テーマを整理して、準備の抜け漏れを減らします。",
              },
              {
                title: "購入は大学別",
                desc: "1大学 ¥3,000。必要な大学だけ買えるので、コストを抑えて精度を上げられます。",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10"
              >
                <div className="text-lg font-semibold tracking-tight">
                  <span className="mr-2 text-[color:var(--color-accent)]">
                    ◆
                  </span>
                  {f.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-[color:var(--color-muted)]">
                  まずは無料で雰囲気を確認
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  過去質問集を開く
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/questions"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
                >
                  無料の過去質問へ
                </a>
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
                >
                  会員登録して投稿特典
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
