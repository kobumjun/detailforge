import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BillingPlans } from "@/components/billing/billing-plans";

async function BillingInner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: recentOrders } = await supabase
    .from("payment_orders")
    .select("id, provider, status, credits_requested, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(15);

  return <BillingPlans recentOrders={recentOrders ?? []} />;
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-muted-foreground">
          불러오는 중…
        </div>
      }
    >
      <BillingInner />
    </Suspense>
  );
}
