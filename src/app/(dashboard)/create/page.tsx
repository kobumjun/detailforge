import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CreateWorkbench } from "@/components/create/create-workbench";

async function CreateInner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: creditLogs }, { data: recentGenerations }] = await Promise.all([
    supabase
      .from("credit_logs")
      .select("id, amount, type, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("generations")
      .select("id, product_description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <CreateWorkbench
      creditLogs={creditLogs ?? []}
      recentGenerations={recentGenerations ?? []}
    />
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-muted-foreground">
          불러오는 중…
        </div>
      }
    >
      <CreateInner />
    </Suspense>
  );
}
