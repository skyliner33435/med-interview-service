/** 管理画面・RLS の管理者判定（AdminClient と Supabase SQL のポリシーを揃える） */
export const ADMIN_EMAILS = ["skyliner33435@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email);
}
