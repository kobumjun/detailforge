"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, Shield, Sparkles } from "lucide-react";
import { prepareInicisStdPay } from "@/app/actions/billing";
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
import { cn } from "@/lib/utils";

/** 서버 액션 `prepareInicisStdPay` 의 formId 와 반드시 동일 */
const INICIS_STDPAY_FORM_ID = "df_inicis_std_pay_form";

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

const PLAN_UX: Record<
  CreditPackageId,
  {
    audience: string;
    usesLine: string;
    pattern: string;
    cta: string;
    ctaSub: string;
  }
> = {
  basic_20: {
    audience: "처음 써보는 개인 판매자 · 소량 테스트",
    usesLine: "상세 초안 약 20번 분량 (1회 생성·변형마다 크레딧 1)",
    pattern: "몇 개 상품만 빠르게 시안을 보고 싶을 때",
    cta: "가볍게 시작하기",
    ctaSub: "부담 없이 기능을 익혀 보세요",
  },
  plus_50: {
    audience: "여러 상품을 자주 만드는 셀러 · 운영자",
    usesLine: "상세 초안 약 50번 분량 — 톤·카피 바꿔가며 여러 버전 만들기에 여유",
    pattern: "스마트스토어·쿠팡용으로 반복 제작할 때",
    cta: "가장 많이 선택하는 플랜",
    ctaSub: "가격 대비 시도 횟수가 넉넉합니다",
  },
  pro_100: {
    audience: "다품목 운영 · 반복 생성 · 팀·대행",
    usesLine: "상세 초안 약 100번 분량 — 대량 시안·A/B에 적합",
    pattern: "클라이언트용이나 시즌마다 묶음으로 뽑을 때",
    cta: "대량 제작 시작하기",
    ctaSub: "한 번 충전으로 긴 호흡 작업에 집중",
  },
};

const CREDIT_USES = [
  "상품마다 톤이 다른 시안을 여러 번 뽑아 비교",
  "CTA·카피만 바꿔 재생성해 전환용 버전 만들기",
  "이미지를 바꿔 올리고 레이아웃을 다시 맞추기",
  "스마트스토어·오픈마켓용 상세 초안을 빠르게 쌓기",
];

const TRUST_POINTS = [
  "결제가 완료되면 크레딧은 곧바로 계정에 반영됩니다.",
  "남은 크레딧은 계정에 안전하게 보관되며, 추가 충전은 언제든 할 수 있습니다.",
  "상세페이지를 만들 때마다 크레딧이 사용됩니다. (초안 생성·변형 등 1회당 1크레딧)",
  "결제 취소·환불은 정책에 따라 고객센터로 문의해 주세요.",
];

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

function fillStdPayForm(form: HTMLFormElement, fields: Record<string, string>) {
  form.replaceChildren();
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
}

function doubleRaf(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function BillingPlans({
  recentPayments,
}: {
  recentPayments: PaymentHistoryRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [busyId, setBusyId] = useState<CreditPackageId | null>(null);

  const showReturnToasts = useCallback(() => {
    if (searchParams.get("pay_ok") === "1") {
      if (searchParams.get("dup") === "1") {
        toast.message("이미 처리된 결제입니다.");
      } else {
        toast.success("크레딧이 반영되었습니다. 바로 상세페이지를 만들어 보세요.");
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

  const pay = async (packageId: CreditPackageId) => {
    setBusyId(packageId);
    try {
      const browserOrigin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const prep = await prepareInicisStdPay(packageId, browserOrigin);
      if (!prep.ok) {
        toast.error(prep.message);
        return;
      }

      const form =
        formRef.current ?? document.getElementById(INICIS_STDPAY_FORM_ID);
      if (!form || !(form instanceof HTMLFormElement)) {
        console.error(
          "[inicis] INIStdPay form not in DOM",
          INICIS_STDPAY_FORM_ID,
        );
        toast.error("결제 폼을 준비하지 못했습니다. 새로고침 후 다시 시도해 주세요.");
        return;
      }

      fillStdPayForm(form, prep.formFields);

      await loadStdPayScript(prep.stdpayScriptUrl);

      await doubleRaf();

      const ready = document.getElementById(INICIS_STDPAY_FORM_ID);
      if (!ready || !(ready instanceof HTMLFormElement)) {
        console.error("[inicis] form missing after layout", INICIS_STDPAY_FORM_ID);
        toast.error("결제 폼을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (!window.INIStdPay?.pay) {
        toast.error("결제 창을 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      window.INIStdPay.pay(INICIS_STDPAY_FORM_ID);
    } catch (e) {
      console.error(e);
      toast.error("결제 준비 중 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <form
        ref={formRef}
        id={INICIS_STDPAY_FORM_ID}
        method="post"
        style={{ display: "none" }}
        aria-hidden
      />

      {/* 1) 가치 설명 */}
      <div className="mb-10 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="size-3" />
          상세페이지 초안을 더 많이 시도할 수 있게
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
          크레딧을 충전하고, 바로 상세페이지를 만들어 보세요
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          필요한 만큼만 충전해 여러 시안을 빠르게 뽑을 수 있습니다. 한 번
          충전해 두면 같은 계정으로 여러 상품 페이지를 반복 생성·수정하며
          쓸 수 있습니다.
        </p>
        <p className="text-[12px] leading-relaxed text-muted-foreground/90">
          결제는 안전한 카드 결제 창으로 진행됩니다.
        </p>
      </div>

      {/* 2) 플랜 카드 */}
      <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
        {CREDIT_PACKAGE_ORDER.map((id) => {
          const pack = CREDIT_PACKAGES[id];
          const ux = PLAN_UX[id];
          const loading = busyId === id;
          const isPopular = id === "plus_50";

          return (
            <Card
              key={id}
              className={cn(
                "relative flex flex-col border-border/80 shadow-sm transition",
                "hover:border-foreground/15",
                isPopular &&
                  "z-[1] border-primary/50 shadow-md ring-2 ring-primary/25 md:scale-[1.02]",
              )}
            >
              {isPopular ? (
                <div className="absolute -top-2.5 left-1/2 z-[2] -translate-x-1/2">
                  <Badge className="px-2.5 text-[10px] font-semibold shadow-sm">
                    추천 · Most Popular
                  </Badge>
                </div>
              ) : null}
              <CardHeader className={cn(isPopular && "pt-7")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    {pack.label}
                  </CardTitle>
                  <Badge variant={isPopular ? "default" : "secondary"}>
                    {pack.credits} 크레딧
                  </Badge>
                </div>
                <CardDescription className="text-[13px] font-medium leading-snug text-foreground/85">
                  {pack.description}
                </CardDescription>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {ux.audience}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-[13px] leading-relaxed">
                <p className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-[12px] text-foreground/90">
                  {ux.usesLine}
                </p>
                <p className="text-[12px] text-muted-foreground">{ux.pattern}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {won(pack.amountKrw)}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  disabled={loading || busyId !== null}
                  className={cn(
                    "w-full font-semibold",
                    isPopular && "shadow-sm",
                  )}
                  variant={isPopular ? "default" : "secondary"}
                  onClick={() => void pay(id)}
                >
                  {loading ? "연결 중…" : ux.cta}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  {ux.ctaSub}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* 3) 크레딧으로 할 수 있는 것 + 안심 */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              크레딧으로 할 수 있는 것
            </CardTitle>
            <CardDescription className="text-[12px] leading-relaxed">
              결제는 &quot;한 번 쓰고 끝&quot;이 아니라, 같은 상품으로 여러 버전을
              시험할 수 있는 시도권에 가깝습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {CREDIT_USES.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-muted/15 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                결제 후 안심하고 쓰세요
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
            {TRUST_POINTS.map((t) => (
              <p key={t}>· {t}</p>
            ))}
            <p className="pt-1 text-[12px]">
              자세한 환불 규정은{" "}
              <Link
                href="/refund-policy"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                환불 정책
              </Link>
              을 참고해 주세요.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4) 결제 내역 — 보조, 기본 접힘 */}
      <details className="group mt-12 rounded-lg border border-border/60 bg-muted/10">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden hover:text-foreground">
          <span>
            결제 내역 보기
            {recentPayments.length > 0 ? (
              <span className="ml-2 font-normal tabular-nums text-muted-foreground/80">
                ({recentPayments.length}건)
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/50 px-4 py-3">
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            카드로 충전한 기록입니다. 취소·환불은 정책에 따라 고객센터로
            문의해 주세요.
          </p>
          <div className="space-y-2 text-sm">
            {recentPayments.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                아직 결제 내역이 없습니다.
              </p>
            ) : (
              recentPayments.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("ko-KR")}
                    </span>
                    <p className="text-[13px] font-medium">
                      {CREDIT_PACKAGES[o.package_id as CreditPackageId]?.label ??
                        o.package_id}{" "}
                      · {o.credits} 크레딧 · {won(o.amount_krw)}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit text-[11px]">
                    {statusLabel(o.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
