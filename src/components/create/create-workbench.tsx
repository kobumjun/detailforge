"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Sparkles, Upload } from "lucide-react";
import {
  generateDetailAction,
  type GenerateState,
} from "@/app/actions/generation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CreditLogRow = {
  id: string;
  amount: number;
  type: string;
  reason: string | null;
  created_at: string;
};

type GenRow = {
  id: string;
  product_description: string;
  created_at: string;
};

function creditLogLabel(reason: string | null, type: string) {
  if (reason === "signup_bonus") return "가입 축하 크레딧";
  if (reason === "generation") return "상세페이지 생성";
  if (reason === "generation_failed") return "생성 실패 환불";
  if (type === "refund") return "크레딧 환불";
  if (type === "consume") return "크레딧 사용";
  if (reason) return reason;
  return type;
}

export function CreateWorkbench({
  creditLogs,
  recentGenerations,
}: {
  creditLogs: CreditLogRow[];
  recentGenerations: GenRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("g");
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState<
    GenerateState | undefined,
    FormData
  >(generateDetailAction, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("새 상세페이지가 준비되었습니다.");
      router.replace(`/create?g=${state.generationId}`);
      startTransition(() => {
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      const next: { file: File; url: string }[] = [];
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        next.push({ file, url: URL.createObjectURL(file) });
      });
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
            상세페이지 만들기
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
            입력 내용을 바탕으로 세로형 레이아웃을 구성합니다. 완성 후 이미지로
            내려받을 수 있습니다.
          </p>
        </div>
        {previewId && (
          <a
            href={`/api/generations/${previewId}/export`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "inline-flex items-center gap-2",
            )}
          >
            <Download className="size-4" />
            이미지로 저장
          </a>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                상품 정보
              </CardTitle>
              <CardDescription className="text-[13px] leading-relaxed">
                상품 설명은 필수입니다. 나머지는 선택 사항입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="productDescription">상품 설명 *</Label>
                  <Textarea
                    id="productDescription"
                    name="productDescription"
                    required
                    rows={4}
                    placeholder="예: 고단백 닭가슴살 소시지, 프리미엄 강아지 간식"
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetCustomer">타겟 고객</Label>
                  <Input
                    id="targetCustomer"
                    name="targetCustomer"
                    placeholder="예: 직장인 20–40대, 반려견 보호자"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tone">톤 / 무드</Label>
                    <select
                      id="tone"
                      name="tone"
                      className={cn(
                        "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm",
                        "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                      )}
                    >
                      <option value="premium">프리미엄</option>
                      <option value="emotional">감성</option>
                      <option value="minimal">미니멀</option>
                      <option value="aggressive">공격적 판매형</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">상세 길이</Label>
                    <select
                      id="length"
                      name="length"
                      className={cn(
                        "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm",
                        "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                      )}
                    >
                      <option value="short">짧음</option>
                      <option value="medium">보통</option>
                      <option value="long">길음</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorHint">색감 / 무드 (선택)</Label>
                  <Input
                    id="colorHint"
                    name="colorHint"
                    placeholder="예: 딥 네이비 + 골드 포인트"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPoints">강조 포인트</Label>
                  <Textarea
                    id="sellingPoints"
                    name="sellingPoints"
                    rows={2}
                    placeholder="예: 국내산 원료, 당일 발송, 무첨가"
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">템플릿</Label>
                  <select
                    id="template"
                    name="template"
                    className={cn(
                      "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm",
                      "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                    )}
                  >
                    <option value="aurora">Aurora — 딥 &amp; 프리미엄</option>
                    <option value="minimal">Minimal — 화이트 카탈로그</option>
                    <option value="editorial">Editorial — 에디토리얼</option>
                  </select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>이미지</Label>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    여러 장을 올리면 앞에서부터 메인 영역과 섹션에 순서대로
                    배치됩니다.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    id="images-input"
                    onChange={(e) => onFiles(e.target.files)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-4" />
                      사진 업로드
                    </Button>
                  </div>
                  {previews.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {previews.map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={p.url}
                          alt=""
                          className="h-20 w-20 rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                  <input
                    type="checkbox"
                    id="aiFillImages"
                    name="aiFillImages"
                    className="mt-1 size-4 rounded border-input"
                  />
                  <div>
                    <Label htmlFor="aiFillImages" className="cursor-pointer font-medium">
                      비주얼 자동 보완
                    </Label>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      업로드가 부족할 때 상품에 맞는 이미지로 빈 영역을 채웁니다.
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={pending} className="w-full gap-2 sm:w-auto">
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      생성 중…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      상세페이지 만들기 · 1크레딧
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                크레딧 내역
              </CardTitle>
              <CardDescription className="text-[13px]">
                최근 사용·충전 기록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {creditLogs.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  아직 기록이 없습니다.
                </p>
              ) : (
                creditLogs.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-3 py-2"
                  >
                    <span className="text-[13px] text-muted-foreground">
                      {creditLogLabel(l.reason, l.type)}
                    </span>
                    <Badge
                      variant={l.amount < 0 ? "destructive" : "secondary"}
                      className="tabular-nums"
                    >
                      {l.amount > 0 ? `+${l.amount}` : l.amount}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-card pb-4">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                미리보기
              </CardTitle>
              <CardDescription className="text-[13px] leading-relaxed">
                완성된 레이아웃을 바로 확인하세요. 저장 시 긴 세로 이미지 한 장으로
                받습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {previewId ? (
                <iframe
                  title="preview"
                  className="h-[min(78vh,920px)] w-full bg-muted/30"
                  src={`/api/generations/${previewId}/preview`}
                />
              ) : (
                <div className="flex h-[min(78vh,920px)] flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <Sparkles className="size-10 opacity-40" />
                  <p className="max-w-xs text-[13px] leading-relaxed">
                    정보를 입력하고 만들기를 누르면 이곳에 결과가 나타납니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                최근 작업
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentGenerations.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  아직 작업이 없습니다.
                </p>
              ) : (
                recentGenerations.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      router.replace(`/create?g=${g.id}`);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-lg border border-transparent px-2 py-2 text-left text-sm transition hover:border-border hover:bg-muted/40"
                  >
                    <span className="line-clamp-1 font-medium">
                      {g.product_description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(g.created_at).toLocaleString("ko-KR")}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
