import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPublicSiteUrl, requireInicisMid } from "@/lib/inicis/config";
import {
  readInicisInt,
  readInicisResultCode,
  readInicisString,
  requestInicisApproval,
} from "@/lib/inicis/approval";
import {
  CREDIT_PACKAGES,
  isCreditPackageId,
  type CreditPackageId,
} from "@/lib/billing/credit-packages";

export const runtime = "nodejs";

function redirectBilling(search: string) {
  const base = getPublicSiteUrl();
  return NextResponse.redirect(new URL(`/billing${search}`, base), 303);
}

function parseMerchantData(raw: string): { userId?: string; packageId?: string } {
  if (!raw?.trim()) return {};
  try {
    const o = JSON.parse(raw) as { u?: string; p?: string };
    return {
      userId: typeof o.u === "string" ? o.u : undefined,
      packageId: typeof o.p === "string" ? o.p : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * KG이니시스 웹표준 STEP2 인증결과 수신 → STEP3 승인요청 → 금액 검증 후 크레딧 지급.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectBilling("?pay_err=form");
  }

  const midForm = String(form.get("mid") ?? "");
  let expectedMid: string;
  try {
    expectedMid = requireInicisMid();
  } catch {
    console.error("[inicis] return missing INICIS_MID");
    return redirectBilling("?pay_err=config");
  }

  if (midForm !== expectedMid) {
    console.error("[inicis] return mid mismatch", midForm);
    return redirectBilling("?pay_err=mid");
  }

  const step2Code = String(form.get("resultCode") ?? "");
  if (step2Code !== "0000") {
    const msg = encodeURIComponent(String(form.get("resultMsg") ?? "").slice(0, 80));
    return redirectBilling(`?pay_err=auth&msg=${msg}`);
  }

  const authToken = String(form.get("authToken") ?? "").trim();
  const authUrl = String(form.get("authUrl") ?? "").trim();
  const orderNumber = String(form.get("orderNumber") ?? "").trim();
  const merchantDataRaw = String(form.get("merchantData") ?? "");

  if (!authToken || !authUrl || !orderNumber) {
    return redirectBilling("?pay_err=params");
  }

  const meta = parseMerchantData(merchantDataRaw);

  const admin = createServiceClient();
  const { data: row, error: selErr } = await admin
    .from("payments")
    .select("id,user_id,package_id,credits,amount_krw,status,order_id")
    .eq("order_id", orderNumber)
    .maybeSingle();

  if (selErr || !row) {
    console.error("[inicis] return no row", selErr);
    return redirectBilling("?pay_err=order");
  }

  if (meta.userId && meta.userId !== row.user_id) {
    return redirectBilling("?pay_err=user");
  }
  if (meta.packageId && meta.packageId !== row.package_id) {
    return redirectBilling("?pay_err=pack");
  }
  if (!isCreditPackageId(row.package_id)) {
    return redirectBilling("?pay_err=pack");
  }

  const pack = CREDIT_PACKAGES[row.package_id as CreditPackageId];
  if (row.amount_krw !== pack.amountKrw || row.credits !== pack.credits) {
    return redirectBilling("?pay_err=row");
  }

  if (row.status !== "pending") {
    if (row.status === "paid") {
      return redirectBilling("?pay_ok=1&dup=1");
    }
    return redirectBilling("?pay_err=state");
  }

  const approval = await requestInicisApproval({
    authUrl,
    authToken,
    price: row.amount_krw,
  });

  if (!approval.ok) {
    return redirectBilling("?pay_err=approve");
  }

  const data = approval.data;
  const apCode = readInicisResultCode(data);
  if (apCode !== "0000") {
    const msg = encodeURIComponent(readInicisString(data, ["resultMsg", "ResultMsg"]).slice(0, 80));
    return redirectBilling(`?pay_err=approve&msg=${msg}`);
  }

  const tid = readInicisString(data, ["tid", "TID"]).trim();
  const moid = readInicisString(data, ["MOID", "moid", "Moid"]).trim();
  const totPrice = readInicisInt(data, ["TotPrice", "totPrice", "TOTPRICE"]);

  if (!tid) {
    return redirectBilling("?pay_err=tid");
  }
  if (moid && moid !== orderNumber) {
    console.error("[inicis] MOID mismatch", moid, orderNumber);
    return redirectBilling("?pay_err=moid");
  }
  if (!Number.isFinite(totPrice) || totPrice !== row.amount_krw) {
    console.error("[inicis] amount mismatch", totPrice, row.amount_krw);
    return redirectBilling("?pay_err=amount");
  }

  let snapshot: object;
  try {
    snapshot = JSON.parse(JSON.stringify(data)) as object;
  } catch {
    snapshot = {};
  }

  const { data: rpcData, error: rpcErr } = await admin.rpc(
    "service_complete_inicis_payment",
    {
      p_order_id: orderNumber,
      p_user_id: row.user_id,
      p_pg_tid: tid,
      p_raw: snapshot,
    },
  );

  if (rpcErr) {
    console.error("[inicis] rpc complete", rpcErr);
    return redirectBilling("?pay_err=db");
  }

  const payload = rpcData as { ok?: boolean; error?: string };
  if (!payload?.ok) {
    return redirectBilling("?pay_err=grant");
  }

  return redirectBilling("?pay_ok=1");
}
