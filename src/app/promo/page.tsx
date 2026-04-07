import { createClient } from "@/lib/supabase/server";
import { PromoRedeemCard } from "@/components/promo/promo-redeem-card";

export default async function PromoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyUsed = false;
  if (user) {
    const { data } = await supabase
      .from("credit_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("reason", "promo_code_bonus")
      .limit(1);
    alreadyUsed = Boolean(data && data.length > 0);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">제휴 프로모션</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          코드 적용 시 10크레딧이 즉시 지급됩니다.
        </p>
      </div>
      <PromoRedeemCard isLoggedIn={Boolean(user)} alreadyUsed={alreadyUsed} />
    </div>
  );
}
