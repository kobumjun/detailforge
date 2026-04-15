"use client";

import { Sparkles } from "lucide-react";

/** 빈 미리보기: 기대감을 주는 정적 예시 (실제 생성 HTML 아님) */
export function CreatePreviewEmpty() {
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-5 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40">
          <Sparkles className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-[14px] font-semibold tracking-tight text-foreground">
            이런 식으로 생성됩니다
          </p>
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            히어로 카피, 핵심 포인트, CTA까지 한 흐름으로 구성된 상세페이지
            초안이 오른쪽에 표시됩니다. 먼저 필수만 입력하고 초안을 받아
            본 뒤, 톤·문구·버전을 여러 번 다듬을 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[320px] shrink-0 rounded-xl border border-border/80 bg-gradient-to-b from-muted/50 to-muted/20 p-4 shadow-sm">
        <div className="mb-3 flex gap-1.5">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
            배지
          </span>
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
            배송
          </span>
        </div>
        <div className="mb-2 h-2.5 w-[88%] rounded bg-foreground/15" />
        <div className="mb-3 h-2 w-[72%] rounded bg-foreground/10" />
        <div className="mb-4 aspect-[16/10] w-full rounded-lg bg-foreground/[0.06]" />
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded bg-foreground/10" />
          <div className="h-1.5 w-[94%] rounded bg-foreground/10" />
          <div className="h-1.5 w-[80%] rounded bg-foreground/10" />
        </div>
        <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
          <div className="flex gap-2">
            <div className="size-2 shrink-0 rounded-full bg-emerald-500/70" />
            <div className="h-1.5 flex-1 rounded bg-foreground/10" />
          </div>
          <div className="flex gap-2">
            <div className="size-2 shrink-0 rounded-full bg-emerald-500/70" />
            <div className="h-1.5 flex-1 rounded bg-foreground/8" />
          </div>
          <div className="flex gap-2">
            <div className="size-2 shrink-0 rounded-full bg-emerald-500/70" />
            <div className="h-1.5 w-[70%] rounded bg-foreground/8" />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-foreground/[0.07] px-3 py-3 text-center">
          <div className="mx-auto mb-2 h-1.5 w-1/2 rounded bg-foreground/12" />
          <div className="mx-auto h-6 w-[55%] rounded-md bg-foreground/20" />
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        예시는 스케치이며, 실제 결과는 입력·이미지·톤에 따라 달라집니다.
      </p>
    </div>
  );
}
