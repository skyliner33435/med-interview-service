"use client";

import { useMemo, useState } from "react";
import type { UniversityQuestionSet } from "../lib/sampleData";

function AccordionItem({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl bg-[color:var(--color-card)] ring-1 ring-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <div>
          <div className="text-base font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
            {subtitle}
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
          <span
            className="text-[color:var(--color-accent)]"
            aria-hidden="true"
          >
            {open ? "－" : "＋"}
          </span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-white/10 px-6 pb-6">
          <div className="pt-5">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function QuestionsClient({
  sets,
}: {
  sets: UniversityQuestionSet[];
}) {
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const query = q.trim();
    if (!query) return sets;
    return sets.filter((s) => {
      if (s.university.includes(query)) return true;
      if (s.prefecture.includes(query)) return true;
      return s.questions.some((x) => x.question.includes(query));
    });
  }, [q, sets]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-5 ring-1 ring-white/10 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)]/15 px-4 py-2 text-sm font-semibold text-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/25">
              無料・登録不要
            </div>
            <div className="mt-3 text-sm text-[color:var(--color-muted)]">
              大学別の過去質問をまとめています（デモのためモックデータ）。
            </div>
          </div>
          <label className="block w-full md:max-w-sm">
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              検索
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="大学名 / 都道府県 / 質問文"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-5">
        {visible.map((s, idx) => (
          <AccordionItem
            key={s.university}
            title={s.university}
            subtitle={`${s.type} / ${s.region} / ${s.prefecture}`}
            defaultOpen={idx === 0 && !q.trim()}
          >
            <ol className="space-y-3">
              {s.questions.map((x) => (
                <li
                  key={x.id}
                  className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <div className="text-sm leading-7">{x.question}</div>
                  {x.notes ? (
                    <div className="mt-2 text-xs leading-6 text-[color:var(--color-muted)]">
                      {x.notes}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}

