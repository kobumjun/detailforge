"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBillingProvider } from "@/lib/billing";
import type { CreditPackId } from "@/lib/billing/types";

export type CheckoutState =
  | { ok: true; message: string; orderId?: string }
  | { ok: false; message: string };

export async function startCheckoutAction(
  _prev: CheckoutState | undefined,
  formData: FormData,
): Promise<CheckoutState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  const packId = String(formData.get("packId") || "") as CreditPackId;
  if (!["pack_10", "pack_30", "pack_100"].includes(packId)) {
    return { ok: false, message: "유효하지 않은 패키지입니다." };
  }

  const provider = getBillingProvider();
  const result = await provider.createCheckout({
    packId,
    userId: user.id,
    email: user.email,
  });

  const { data: order, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      provider: result.provider,
      status: result.ok ? "pending" : "failed",
      credits_requested:
        packId === "pack_10" ? 10 : packId === "pack_30" ? 30 : 100,
      external_id: result.orderId,
      payload: { result, packId },
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: "주문 기록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/billing");

  if (!result.ok) {
    return { ok: false, message: result.message || "결제를 시작할 수 없습니다." };
  }

  return {
    ok: true,
    orderId: order?.id,
    message:
      result.message ||
      (result.checkoutUrl
        ? "결제 페이지로 이동합니다."
        : "요청이 접수되었습니다. 결제가 완료되면 크레딧이 반영됩니다."),
  };
}
