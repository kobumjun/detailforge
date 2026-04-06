"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { prepareInicisStdPay } from "@/app/actions/billing";
import type { PrepareInicisState } from "@/app/actions/billing";
import {
  CREDIT_PACKAGES,
  CREDIT_PACKAGE_ORDER,
  type CreditPackageId,
} from "@/lib/billing/credit-packages";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    INIStdPay?: { pay: (formId: string) => void };
  }
}

export type PaymentHistoryRow = {
  id: string;
  package_id: string;
  credits: number;
  amount_krw: number;
  status: string;
  order_id: string;
  created_at: string;
  credits_granted_at: string | null;
};

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function statusLabel(status: string) {
  if (status === "pending") return "결제 대기";
  if (status === "paid") return "결제 완료";
  if (status === "cancelled") return "취소됨";
  if (status === "failed") return "실패";
  return status;
}

function loadStdPayScript(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = document.querySelector(`script[data-inicis-stdpay="1"]`);
  if (existing && window.INIStdPay?.pay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.inicisStdpay = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script"));
    document.body.appendChild(s);
  });
}

export function BillingPlans({
  recentPayments,
}: {
  recentPayments: PaymentHistoryRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyId, setBusyId] = useState<CreditPackageId | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [stdPayLaunch, setStdPayLaunch] = useState<
    Extract<PrepareInicisState, { ok: true }> | null
  >(null);

  const showReturnToasts = useCallback(() => {
    if (searchParams.get("pay_ok") === "1") {
      if (searchParams.get("dup") === "1") {
        toast.message("이미 처리된 결제입니다.");
      } else {
        toast.success("크레딧이 충전되었습니다.");
      }
      router.replace("/billing");
      router.refresh();
      return;
    }
    const err = searchParams.get("pay_err");
    if (err) {
      const msg = searchParams.get("msg");
      const decoded = msg
        ? (() => {
            try {
              return decodeURIComponent(msg);
            } catch {
              return msg;
            }
          })()
        : "";
      const map: Record<string, string> = {
        form: "결제 응답을 받지 못했습니다.",
        config: "결제 서버 설정을 확인해 주세요.",
        mid: "상점 정보가 일치하지 않습니다.",
        auth: decoded || "카드 인증에 실패했습니다.",
        params: "결제 정보가 올바르지 않습니다.",
        order: "주문을 찾을 수 없습니다.",
        user: "주문 정보가 계정과 일치하지 않습니다.",
        pack: "상품 정보가 올바르지 않습니다.",
        row: "주문 금액 정보가 올바르지 않습니다.",
        state: "이미 처리된 주문입니다.",
        approve: decoded || "승인 처리에 실패했습니다.",
        tid: "거래 번호를 확인할 수 없습니다.",
        moid: "주문번호가 일치하지 않습니다.",
        amount: "결제 금액이 주문과 일치하지 않습니다.",
        db: "결제 기록 저장 중 오류가 발생했습니다.",
        grant: "크레딧 지급에 실패했습니다.",
      };
      toast.error(map[err] || "결제 처리 중 오류가 발생했습니다.");
      router.replace("/billing");
      router.refresh();
    }
  }, [router, searchParams]);

  useEffect(() => {
    showReturnToasts();
  }, [showReturnToasts]);

  useEffect(() => {
    if (searchParams.get("inicis_closed") === "1") {
      toast.message("결제 창이 닫혔습니다.");
      router.replace("/billing");
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!stdPayLaunch) return;
    let cancelled = false;

    void (async () => {
      try {
        await loadStdPayScript(stdPayLaunch.stdpayScriptUrl);
        if (cancelled) return;
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled) return;
        if (!window.INIStdPay?.pay) {
          toast.error("KG이니시스 결제 모듈을 불러오지 못했습니다.");
          return;
        }
        window.INIStdPay.pay(stdPayLaunch.formId);
      } catch {
        if (!cancelled) toast.error("결제 스크립트를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setStdPayLaunch(null);
          setBusyId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stdPayLaunch]);

  const pay = async (packageId: CreditPackageId) => {
    setBusyId(packageId);
    try {
      const prep = await prepareInicisStdPay(packageId);
      if (!prep.ok) {
        toast.error(prep.message);
        setBusyId(null);
        return;
      }
      setStdPayLaunch(prep);
    } catch (e) {
      console.error(e);
      toast.error("결제 준비 중 오류가 발생했습니다.");
      setBusyId(null);
    }
  };

  const cancelPayment = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const res = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.message || "취소에 실패했습니다.");
        return;
      }
      toast.success(data.message || "취소되었습니다.");
      router.refresh();
    } catch {
      toast.error("취소 요청 중 오류가 발생했습니다.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {stdPayLaunch ? (
        <form
          id={stdPayLaunch.formId}
          method="post"
          style={{ display: "none" }}
          aria-hidden
        >
          {Object.entries(stdPayLaunch.formFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} readOnly />
          ))}
        </form>
      ) : null}

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-[1.75rem]">
          크레딧 충전
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
          KG이니시스 웹표준 결제로 충전합니다. 상세페이지 1회 제작에 크레딧 1이
          사용됩니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKAGE_ORDER.map((id) => {
          const pack = CREDIT_PACKAGES[id];
          const loading = busyId === id;
          return (
            <Card
              key={id}
              className="flex flex-col border-border/80 shadow-sm transition hover:border-foreground/15"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    {pack.label}
                  </CardTitle>
                  <Badge variant="secondary">{pack.credits} 크레딧</Badge>
                </div>
                <CardDescription className="text-[13px] leading-relaxed">
                  {pack.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {won(pack.amountKrw)}
                </p>
                <p>
                  인증 후 서버에서 승인·금액을 검증한 뒤에만 크레딧이 지급됩니다.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  disabled={loading || busyId !== null || stdPayLaunch !== null}
                  className="w-full font-semibold"
                  onClick={() => void pay(id)}
                >
                  {loading ? "처리 중…" : "결제하기"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            최근 결제
          </CardTitle>
          <CardDescription className="text-[13px] leading-relaxed">
            KG이니시스 카드 결제 충전 내역입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentPayments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              아직 결제 내역이 없습니다.
            </p>
          ) : (
            recentPayments.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <span className="text-[12px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("ko-KR")}
                  </span>
                  <p className="text-[13px] font-medium">
                    {CREDIT_PACKAGES[o.package_id as CreditPackageId]?.label ??
                      o.package_id}{" "}
                    · {o.credits} 크레딧 · {won(o.amount_krw)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {statusLabel(o.status)}
                  </Badge>
                  {o.status === "paid" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-[12px]"
                      disabled={cancellingOrderId !== null}
                      onClick={() => void cancelPayment(o.order_id)}
                    >
                      {cancellingOrderId === o.order_id
                        ? "취소 중…"
                        : "결제 취소"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
