"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type InterviewFormat =
  | "個人面接"
  | "集団面接"
  | "MMI"
  | "グループ討論"
  | "その他";

const FORMATS: InterviewFormat[] = [
  "個人面接",
  "集団面接",
  "MMI",
  "グループ討論",
  "その他",
];

const REGION_OPTIONS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州",
] as const;

/** ドロップダウンを白背景・黒系文字で読みやすくする */
const SELECT_FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-[color:var(--color-accent)]/70 focus:ring-2 focus:ring-[color:var(--color-accent)]/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 [color-scheme:light]";

type UniversityRow = {
  name: string;
  prefecture: string;
  region: string;
  ownership: string;
};

export function SubmitClient() {
  const router = useRouter();

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3, y - 4].map(String);
  }, []);

  const [universityRows, setUniversityRows] = useState<UniversityRow[]>([]);
  const [uniLoading, setUniLoading] = useState(true);
  const [uniError, setUniError] = useState<string | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<
    "" | "国立" | "公立" | "私立"
  >("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [university, setUniversity] = useState("");
  const [year, setYear] = useState(years[0]);
  const [format, setFormat] = useState<InterviewFormat>("個人面接");
  const [qa, setQa] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [scoreDisclosure, setScoreDisclosure] = useState("");
  const [improvement, setImprovement] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser((data.user as User | null) ?? null);
      setBooting(false);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    setUniLoading(true);
    setUniError(null);
    void supabase
      .from("universities")
      .select("name, prefecture, region, ownership")
      .order("region")
      .order("name")
      .then(
        (res: {
          data: UniversityRow[] | null;
          error: { message: string } | null;
        }) => {
          if (res.error) {
            setUniError(res.error.message);
            setUniversityRows([]);
          } else {
            setUniversityRows(res.data ?? []);
          }
          setUniLoading(false);
        }
      );
  }, []);

  const filteredUniversities = useMemo(() => {
    if (!ownershipFilter || !regionFilter) return [];
    return universityRows.filter(
      (r) => r.ownership === ownershipFilter && r.region === regionFilter
    );
  }, [universityRows, ownershipFilter, regionFilter]);

  useEffect(() => {
    const list = filteredUniversities;
    if (list.length === 0) {
      setUniversity("");
      return;
    }
    setUniversity((prev) => {
      if (prev && list.some((u) => u.name === prev)) return prev;
      return list[0]!.name;
    });
  }, [filteredUniversities]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = (userData.user as User | null) ?? null;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const uniOk = universityRows.some(
        (r) =>
          r.name === university &&
          r.ownership === ownershipFilter &&
          r.region === regionFilter
      );
      if (
        !ownershipFilter ||
        !regionFilter ||
        !university ||
        !uniOk
      ) {
        throw new Error(
          "受験大学を、国立/公立/私立 → 地方 → 大学名の順で選択してください。"
        );
      }

      if (!imageFile) {
        throw new Error(
          "大学名のわかる得点開示の資料を添付してください。投稿には画像が必須です。"
        );
      }

      const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
      if (imageFile.size > MAX_IMAGE_BYTES) {
        throw new Error("添付画像は 10MB 以下にしてください。");
      }

      const extMatch = imageFile.name.match(/\.[^/.]+$/);
      const ext =
        extMatch && extMatch[0].length <= 12 ? extMatch[0].toLowerCase() : "";
      const path = `${currentUser.id}/${crypto.randomUUID()}${ext}`;
      const { error: upErr } = await supabase.storage
        .from("report-images")
        .upload(path, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type || "application/octet-stream",
        });
      if (upErr) {
        console.error("[reports.storage] upload failed", upErr);
        throw new Error(
          upErr.message.includes("Bucket not found") ||
            upErr.message.includes("not found")
            ? "画像ストレージ（report-images）が未設定です。Supabase の Storage と SQL を確認してください。"
            : `画像のアップロードに失敗しました: ${upErr.message}`
        );
      }
      const { data: pub } = supabase.storage
        .from("report-images")
        .getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      const payload = {
        university_name: university,
        year: Number(year),
        format,
        content: qa,
        atmosphere,
        score: scoreDisclosure || null,
        improvement: improvement || null,
        status: "pending",
        submitted_by: currentUser.id,
        image_url: imageUrl,
      };

      const { error: insertError } = await supabase.from("reports").insert(payload);
      if (insertError) {
        // Log details to the browser console for debugging RLS issues.
        console.error("[reports.insert] failed", {
          insertError,
          message: (insertError as any)?.message,
          details: (insertError as any)?.details,
          hint: (insertError as any)?.hint,
          code: (insertError as any)?.code,
          payload,
          currentUser: { id: currentUser.id, email: currentUser.email },
        });

        const msg = insertError.message || "insert failed";
        const rlsHint =
          msg.includes("row-level security") || msg.includes("permission")
            ? "（RLS/権限設定を確認してください）"
            : "";
        throw new Error(`${msg}${rlsHint ? " " + rlsHint : ""}`);
      }

      alert("投稿を受け付けました。承認後に公開されます。");
      setQa("");
      setAtmosphere("");
      setScoreDisclosure("");
      setImprovement("");
      setImageFile(null);
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        const msg = String((err as { message?: unknown }).message ?? "");
        setError(msg || "投稿に失敗しました。");
      } else {
        setError("投稿に失敗しました。");
      }
    } finally {
      setSending(false);
    }
  }

  if (booting) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="h-5 w-48 rounded bg-white/5" />
        <div className="mt-3 h-4 w-72 rounded bg-white/5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="text-sm text-[color:var(--color-muted)]">
          レポート投稿はログインが必要です。
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-6 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)]"
          >
            ログインへ
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10"
          >
            無料登録
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <div className="space-y-5">
          <div>
            <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
              受験大学
            </div>
            {uniError ? (
              <p className="mt-2 text-xs leading-6 text-red-200/90">
                大学一覧を読み込めませんでした: {uniError}
              </p>
            ) : null}
            {!uniLoading && universityRows.length === 0 && !uniError ? (
              <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                Supabase の{" "}
                <code className="text-[color:var(--color-foreground)]">universities</code>{" "}
                テーブルに行がありません。SQL シードを実行してください。
              </p>
            ) : null}

            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <label className="block">
                <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
                  ステップ1：国立・公立・私立
                </div>
                <select
                  required
                  value={ownershipFilter}
                  disabled={uniLoading || universityRows.length === 0}
                  onChange={(e) => {
                    const v = e.target.value as "" | "国立" | "公立" | "私立";
                    setOwnershipFilter(v);
                    setRegionFilter("");
                    setUniversity("");
                  }}
                  className={SELECT_FIELD_CLASS}
                >
                  <option value="" className="text-neutral-900">
                    {uniLoading ? "読み込み中…" : "選択してください"}
                  </option>
                  <option value="国立" className="text-neutral-900">
                    国立
                  </option>
                  <option value="公立" className="text-neutral-900">
                    公立
                  </option>
                  <option value="私立" className="text-neutral-900">
                    私立
                  </option>
                </select>
              </label>

              <label className="block">
                <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
                  ステップ2：地方
                </div>
                <select
                  required
                  value={regionFilter}
                  disabled={uniLoading || !ownershipFilter}
                  onChange={(e) => {
                    setRegionFilter(e.target.value);
                    setUniversity("");
                  }}
                  className={SELECT_FIELD_CLASS}
                >
                  <option value="" className="text-neutral-900">
                    選択してください
                  </option>
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r} className="text-neutral-900">
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
                  ステップ3：大学名
                </div>
                <select
                  required
                  value={university}
                  disabled={
                    uniLoading ||
                    !ownershipFilter ||
                    !regionFilter ||
                    filteredUniversities.length === 0
                  }
                  onChange={(e) => setUniversity(e.target.value)}
                  className={SELECT_FIELD_CLASS}
                >
                  {!ownershipFilter || !regionFilter ? (
                    <option value="" className="text-neutral-900">
                      上の項目を先に選択してください
                    </option>
                  ) : filteredUniversities.length === 0 ? (
                    <option value="" className="text-neutral-900">
                      該当する大学がありません
                    </option>
                  ) : (
                    filteredUniversities.map((u) => (
                      <option key={u.name} value={u.name} className="text-neutral-900">
                        {u.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
                年度
              </div>
              <select
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={SELECT_FIELD_CLASS}
              >
                {years.map((y) => (
                  <option key={y} value={y} className="text-neutral-900">
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
                面接形式
              </div>
              <select
                required
                value={format}
                onChange={(e) => setFormat(e.target.value as InterviewFormat)}
                className={SELECT_FIELD_CLASS}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f} className="text-neutral-900">
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            質問と回答（複数OK）
          </div>
          <textarea
            required
            value={qa}
            onChange={(e) => setQa(e.target.value)}
            placeholder="例）\nQ: 志望理由は？\nA: ...\n\nQ: 失敗経験は？\nA: ..."
            rows={8}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        <div className="mt-4">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            大学名のわかる得点開示の資料
            <span className="ml-1.5 text-red-200/90">（必須）</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
            大学名のわかる得点開示の資料を添付してください。画像は 1 枚まで（10MB
            以下）。Supabase Storage のバケット{" "}
            <code className="text-[color:var(--color-foreground)]">report-images</code>{" "}
            が必要です。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex max-w-full cursor-pointer">
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setImageFile(f ?? null);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex min-h-10 max-w-full items-center justify-center whitespace-normal rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-xs font-semibold leading-snug tracking-tight text-[color:var(--color-foreground)] transition hover:bg-white/10 sm:text-sm">
                大学名のわかる得点開示の資料
              </span>
            </label>
            {imageFile ? (
              <>
                <span className="text-xs text-[color:var(--color-muted)]">
                  {imageFile.name}（{(imageFile.size / 1024).toFixed(0)} KB）
                </span>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs font-semibold text-red-200/90 underline-offset-2 hover:underline"
                >
                  添付を外す
                </button>
              </>
            ) : null}
          </div>
          {imagePreviewUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="選択中の画像プレビュー"
                className="max-h-48 w-full object-contain bg-black/20"
              />
            </div>
          ) : null}
        </div>

        <label className="mt-4 block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            雰囲気（圧迫/和やか 等）
          </div>
          <textarea
            value={atmosphere}
            onChange={(e) => setAtmosphere(e.target.value)}
            placeholder="例）穏やか。相槌多め。深掘りは志望理由と自己PRが中心。"
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>
      </div>

      <div className="rounded-3xl bg-[color:var(--color-card)] p-6 ring-1 ring-white/10">
        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            改善点・振り返り（任意）
          </div>
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="例）結論→根拠→具体例の型を徹底し、大学別の志望理由を強化する。"
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        <label className="block">
          <div className="text-xs font-semibold tracking-tight text-[color:var(--color-muted)]">
            開示点数（任意）
          </div>
          <input
            value={scoreDisclosure}
            onChange={(e) => setScoreDisclosure(e.target.value)}
            placeholder="例）総合 82/100（面接 18/20）など"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-[color:var(--color-accent)]/60"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-6 text-[color:var(--color-muted)]">
            ※ 投稿は承認待ち（pending）として保存されます。承認後に公開されます。
            大学名のわかる得点開示の資料（画像）は必須です。
          </div>
          <button
            type="submit"
            disabled={
              sending ||
              uniLoading ||
              universityRows.length === 0 ||
              Boolean(uniError) ||
              !ownershipFilter ||
              !regionFilter ||
              !university
            }
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-7 text-sm font-semibold tracking-tight text-[#1a2744] transition hover:bg-[color:var(--color-accent-2)] disabled:opacity-60"
          >
            {sending ? "送信中…" : "送信する"}
          </button>
        </div>
      </div>
    </form>
  );
}

