"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  startCheckoutAction,
  type CheckoutState,
} from "@/app/actions/billing";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/billing/types";
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

const PACK_ORDER: CreditPackId[] = ["pack_10", "pack_30", "pack_100"];

type OrderRow = {
  id: string;
  provider: string;
  status: string;
  credits_requested: number;
  created_at: string;
};

function orderStatusLabel(status: string) {
  if (status === "pending") return "접수됨";
  if (status === "failed") return "실패";
  if (status === "paid" || status === "completed") return "완료";
  return status;
}

function providerLabel(provider: string) {
  if (provider === "mock") return "결제 준비 중";
  return provider;
}

export function BillingPlans({ recentOrders }: { recentOrders: OrderRow[] }) {
  const [state, formAction, pending] = useActionState<
    CheckoutState | undefined,
    FormData
  >(startCheckoutAction, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-[1.75rem]">
          크레딧 충전
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
          상세페이지 1회 제작 시 크레딧 1이 사용됩니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PACK_ORDER.map((id) => {
          const pack = CREDIT_PACKS[id];
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
              <CardContent className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
                결제가 열리면 같은 화면에서 바로 충전이 완료됩니다.
              </CardContent>
              <CardFooter>
                <form action={formAction} className="w-full">
                  <input type="hidden" name="packId" value={id} />
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full font-semibold"
                  >
                    결제 진행
                  </Button>
                </form>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            최근 요청
          </CardTitle>
          <CardDescription className="text-[13px] leading-relaxed">
            결제·충전 요청 기록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentOrders.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              아직 요청 내역이 없습니다.
            </p>
          ) : (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <span className="text-[12px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ko-KR")}
                </span>
                <span className="text-[13px] font-medium">
                  {o.credits_requested} 크레딧 · {providerLabel(o.provider)}
                </span>
                <Badge variant="outline" className="text-[11px]">
                  {orderStatusLabel(o.status)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
