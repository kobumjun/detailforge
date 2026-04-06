import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { inicisCardFullRefund } from "@/lib/inicis/refund";

const ADMIN_SECRET_HEADER = "x-payments-admin-secret";

function refundRequestClientIp(): string {
  return process.env.INICIS_CLIENT_IP?.trim() || "127.0.0.1";
}

/**
 * 관리자/백오피스 전용 결제 취소·환불.
 * 일반 로그인 세션만으로는 호출할 수 없으며, `PAYMENTS_ADMIN_CANCEL_SECRET` 과
 * 동일한 값의 `X-Payments-Admin-Secret` 요청 헤더가 있어야 합니다.
 */
export async function POST(request: Request) {
  const expected = process.env.PAYMENTS_ADMIN_CANCEL_SECRET?.trim();
  const provided = request.headers.get(ADMIN_SECRET_HEADER)?.trim();
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { ok: false, message: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const orderId =
    typeof (body as { orderId?: string }).orderId === "string"
      ? (body as { orderId: string }).orderId.trim()
      : "";

  if (!orderId) {
    return NextResponse.json(
      { ok: false, message: "주문 정보가 없습니다." },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  const { data: row, error: selErr } = await admin
    .from("payments")
    .select("id,user_id,status,order_id,credits,pg_tid")
    .eq("order_id", orderId)
    .maybeSingle();

  if (selErr || !row) {
    return NextResponse.json(
      { ok: false, message: "결제 내역을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (row.status !== "paid") {
    return NextResponse.json(
      {
        ok: false,
        message:
          row.status === "cancelled"
            ? "이미 취소된 결제입니다."
            : "취소할 수 있는 완료 결제가 아닙니다.",
      },
      { status: 400 },
    );
  }

  if (!row.pg_tid?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        message: "거래 번호가 없어 취소할 수 없습니다.",
      },
      { status: 400 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", row.user_id)
    .single();

  if (!profile || profile.credits < row.credits) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "충전된 크레딧을 이미 사용해 전액 취소할 수 없습니다.",
      },
      { status: 400 },
    );
  }

  const refund = await inicisCardFullRefund({
    tid: row.pg_tid.trim(),
    clientIp: refundRequestClientIp(),
  });

  if (!refund.ok) {
    console.error("[inicis] refund failed", refund);
    return NextResponse.json(
      {
        ok: false,
        message: refund.message || "결제 취소 요청에 실패했습니다.",
      },
      { status: 502 },
    );
  }

  const { data: rpcData, error: rpcErr } = await admin.rpc(
    "service_refund_inicis_payment",
    {
      p_order_id: orderId,
      p_user_id: row.user_id,
    },
  );

  if (rpcErr) {
    console.error("[payments] refund rpc", rpcErr);
    return NextResponse.json(
      {
        ok: false,
        message:
          "PG 취소는 되었으나 크레딧 차감에 실패했습니다. 데이터 정합성을 확인하세요.",
      },
      { status: 500 },
    );
  }

  const payload = rpcData as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: "크레딧 환불 처리에 실패했습니다.",
        code: payload?.error,
      },
      { status: 400 },
    );
  }

  revalidatePath("/billing");
  revalidatePath("/create");

  return NextResponse.json({
    ok: true,
    message: "결제가 취소되고 크레딧이 회수되었습니다.",
    credits: (payload as { credits?: number }).credits,
  });
}
