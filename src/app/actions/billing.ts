"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKAGES, isCreditPackageId } from "@/lib/billing/credit-packages";
import {
  getPublicSiteUrl,
  getStdPayScriptUrl,
  requireInicisMid,
  requireInicisSignKey,
} from "@/lib/inicis/config";
import { inicisStdPayRequestHashes } from "@/lib/inicis/crypto";

export type PrepareInicisState =
  | {
      ok: true;
      /** INIStdPay hidden input name → value */
      formFields: Record<string, string>;
      stdpayScriptUrl: string;
      formId: string;
    }
  | { ok: false; message: string };

function newOrderId(): string {
  return `df_${crypto.randomUUID().replace(/-/g, "")}`;
}

function limitUtf8Bytes(s: string, maxBytes: number): string {
  const buf = Buffer.from(s, "utf8");
  if (buf.length <= maxBytes) return s;
  let len = maxBytes;
  while (len > 0 && (buf[len - 1] & 0xc0) === 0x80) len--;
  return buf.subarray(0, len).toString("utf8");
}

/**
 * returnUrl/closeUrl 베이스: env와 실제 브라우저 origin 불일치(localhost vs 127.0.0.1 등) 시
 * 세션 쿠키가 안 실려 /billing 복귀 때 미들웨어가 로그인으로 보내는 문제를 막기 위해
 * 신뢰할 수 있는 경우에만 클라이언트 origin을 사용합니다.
 */
function resolveInicisPublicBase(browserOrigin: string | undefined): string {
  const configured = getPublicSiteUrl();
  if (!browserOrigin?.trim()) return configured;
  try {
    const b = new URL(browserOrigin);
    if (b.protocol !== "http:" && b.protocol !== "https:") return configured;
    const candidate = `${b.protocol}//${b.host}`;
    const cfg = new URL(configured);
    const configuredOrigin = `${cfg.protocol}//${cfg.host}`;
    if (candidate === configuredOrigin) return candidate;
    const isDev = process.env.NODE_ENV === "development";
    const h = b.hostname;
    if (isDev && (h === "localhost" || h === "127.0.0.1")) return candidate;
    return configured;
  } catch {
    return configured;
  }
}

/**
 * KG이니시스 웹표준(INIStdPay) 호출 직전 pending 행 생성 및 서명 필드 반환.
 * @param browserOrigin 결제를 연 브라우저의 `window.location.origin` (close/return URL 쿠키 일치용)
 */
export async function prepareInicisStdPay(
  packageId: string,
  browserOrigin?: string,
): Promise<PrepareInicisState> {
  if (!isCreditPackageId(packageId)) {
    return { ok: false, message: "유효하지 않은 상품입니다." };
  }

  let mid: string;
  let signKey: string;
  try {
    mid = requireInicisMid();
    signKey = requireInicisSignKey();
  } catch {
    return {
      ok: false,
      message: "결제 설정(INICIS_MID, INICIS_SIGN_KEY)이 필요합니다.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  const pack = CREDIT_PACKAGES[packageId];
  const oid = newOrderId();
  const price = String(pack.amountKrw);
  const timestamp = Date.now().toString();
  const { signature, verification, mKey } = inicisStdPayRequestHashes({
    oid,
    price,
    timestamp,
    signKey,
  });

  const site = resolveInicisPublicBase(browserOrigin);
  const returnUrl = `${site}/api/payments/inicis/return`;
  const closeUrl = `${site}/billing?inicis_closed=1`;

  const email = user.email ?? "";
  const buyername = limitUtf8Bytes(
    email.split("@")[0] || "customer",
    30,
  );
  const goodname = limitUtf8Bytes(
    `DetailForge 크레딧 ${pack.credits}`,
    40,
  );

  const merchantData = JSON.stringify({
    u: user.id,
    p: packageId,
  });

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    package_id: packageId,
    credits: pack.credits,
    amount_krw: pack.amountKrw,
    provider: "inicis",
    order_id: oid,
    status: "pending",
  });

  if (error) {
    console.error("[billing] insert payment", error);
    return {
      ok: false,
      message: "결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/billing");

  const formFields: Record<string, string> = {
    version: "1.0",
    gopaymethod: "Card",
    mid,
    oid,
    price,
    timestamp,
    use_chkfake: "Y",
    signature,
    verification,
    mKey,
    currency: "WON",
    goodname,
    buyername,
    buyertel: "010-0000-0000",
    buyeremail: email || "noreply@example.com",
    returnUrl,
    closeUrl,
    acceptmethod: "centerCd(Y)",
    merchantData,
  };

  return {
    ok: true,
    formFields,
    stdpayScriptUrl: getStdPayScriptUrl(),
    formId: "df_inicis_std_pay_form",
  };
}
