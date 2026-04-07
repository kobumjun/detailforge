import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인 후 코드를 입력해 주세요." },
      { status: 401 },
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

  const code = normalizeCode(
    typeof (body as { code?: string }).code === "string"
      ? (body as { code: string }).code
      : "",
  );

  if (!code || code.length < 8) {
    return NextResponse.json(
      { ok: false, message: "코드를 정확히 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  const { data, error } = await admin.rpc("service_redeem_promo_code", {
    p_code: code,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[promo] redeem rpc", error);
    return NextResponse.json(
      { ok: false, message: "코드 적용 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    credits_added?: number;
    credits?: number;
  };
  if (!payload?.ok) {
    const message =
      payload?.error === "invalid_code"
        ? "유효하지 않은 코드입니다."
        : payload?.error === "code_already_used"
          ? "이미 사용된 코드입니다."
          : payload?.error === "user_already_used"
            ? "이미 프로모션 코드를 사용한 계정입니다."
            : payload?.error === "not_authenticated"
              ? "로그인 후 코드를 입력해 주세요."
              : "코드를 적용할 수 없습니다.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  revalidatePath("/promo");
  revalidatePath("/create");
  revalidatePath("/billing");

  return NextResponse.json({
    ok: true,
    message: `${payload.credits_added ?? 10}크레딧이 지급되었습니다.`,
    credits: payload.credits,
  });
}
