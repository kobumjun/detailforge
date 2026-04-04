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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          크레딧 충전
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          생성 1회당 1크레딧이 사용됩니다. 결제는 프로바이더 설정 후 자동으로
          연결됩니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PACK_ORDER.map((id) => {
          const pack = CREDIT_PACKS[id];
          return (
            <Card
              key={id}
              className="flex flex-col border-border/80 shadow-sm transition hover:border-foreground/20"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{pack.label}</CardTitle>
                  <Badge variant="secondary">{pack.credits} 크레딧</Badge>
                </div>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                상세페이지 생성에 바로 사용할 수 있는 크레딧 번들입니다.
              </CardContent>
              <CardFooter>
                <form action={formAction} className="w-full">
                  <input type="hidden" name="packId" value={id} />
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full"
                  >
                    결제하기
                  </Button>
                </form>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">최근 주문</CardTitle>
          <CardDescription>Mock / LemonSqueezy 연동 시 상태가 갱신됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground">주문 기록이 없습니다.</p>
          ) : (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ko-KR")}
                </span>
                <span className="font-medium">
                  {o.credits_requested} 크레딧 · {o.provider}
                </span>
                <Badge variant="outline">{o.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
