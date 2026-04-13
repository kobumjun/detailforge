"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Download, FolderOpen, Loader2, Sparkles, Upload } from "lucide-react";
import {
  generateDetailAction,
  type GenerateState,
} from "@/app/actions/generation";
import type { GenerationPayload } from "@/lib/generation/types";
import { renderDetailDocument } from "@/lib/generation/render-html";
import {
  listLocalDetailDrafts,
  removeLocalDetailDraft,
  saveLocalDetailDraft,
} from "@/lib/create/local-detail-drafts";
import { DetailTextEditor } from "@/components/create/detail-text-editor";
import { Button } from "@/components/ui/button";
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

function creditLogLabel(reason: string | null, type: string) {
  if (reason === "signup_bonus") return "가입 축하 크레딧";
  if (reason === "generation") return "상세페이지 생성";
  if (reason === "generation_failed") return "생성 실패 환불";
  if (type === "refund") return "크레딧 환불";
  if (type === "consume") return "크레딧 사용";
  if (reason) return reason;
  return type;
}

export function CreateWorkbench({ creditLogs }: { creditLogs: CreditLogRow[] }) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<{
    payload: GenerationPayload;
  } | null>(null);
  const [draftListTick, setDraftListTick] = useState(0);

  const previewHtml = useMemo(() => {
    if (!sessionPreview) return "";
    try {
      return renderDetailDocument(sessionPreview.payload);
    } catch (e) {
      console.error("[preview]", e);
      return `<!DOCTYPE html><html lang="ko"><meta charset="utf-8"/><body style="font-family:system-ui;padding:24px">미리보기를 렌더링하지 못했습니다.</body></html>`;
    }
  }, [sessionPreview]);

  const EXPORT_FAIL_MSG =
    "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

  const [state, formAction, pending] = useActionState<
    GenerateState | undefined,
    FormData
  >(generateDetailAction, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("상세페이지가 준비되었습니다. 새로고침하면 사라집니다.");
      setSessionPreview({ payload: state.payload });
      startTransition(() => {
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const handlePayloadChange = useCallback((next: GenerationPayload) => {
    setSessionPreview({ payload: next });
  }, []);

  const localDrafts = useMemo(
    () => listLocalDetailDrafts(),
    [sessionPreview, draftListTick],
  );

  async function handleExportPng() {
    if (!sessionPreview || exportingPng) return;
    setExportingPng(true);
    try {
      const res = await fetch("/api/export/png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payload: sessionPreview.payload }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || ct.includes("application/json")) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        toast.error(data?.message || EXPORT_FAIL_MSG);
        return;
      }
      if (!ct.includes("image/png")) {
        toast.error(EXPORT_FAIL_MSG);
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "detail.png";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error(EXPORT_FAIL_MSG);
    } finally {
      setExportingPng(false);
    }
  }

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
        </div>
        {sessionPreview && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={exportingPng}
            onClick={() => void handleExportPng()}
          >
            {exportingPng ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                이미지 준비 중…
              </>
            ) : (
              <>
                <Download className="size-4" />
                이미지로 저장
              </>
            )}
          </Button>
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

          {sessionPreview ? (
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[15px] font-semibold tracking-tight">
                  텍스트 편집
                </CardTitle>
                <CardDescription className="text-[13px] leading-relaxed">
                  수정 내용은 오른쪽 미리보기와 PNG 저장에 즉시 반영됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DetailTextEditor
                  payload={sessionPreview.payload}
                  onChange={handlePayloadChange}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                브라우저 임시 보관
              </CardTitle>
              <CardDescription className="text-[13px] leading-relaxed">
                최근 작업물 최대 2개만 이 기기에 저장됩니다. 다른 기기나
                시크릿 창과는 공유되지 않습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionPreview ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => {
                    const ok = saveLocalDetailDraft(sessionPreview.payload);
                    setDraftListTick((t) => t + 1);
                    if (ok) {
                      toast.success("이 브라우저에 저장했습니다.");
                    } else {
                      toast.error(
                        "저장에 실패했습니다. 저장 공간이나 설정을 확인해 주세요.",
                      );
                    }
                  }}
                >
                  현재 결과를 임시 저장
                </Button>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  생성 후 &quot;임시 저장&quot;을 누르면 여기에 쌓입니다.
                </p>
              )}
              {localDrafts.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  저장된 임시 작업이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {localDrafts.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {d.summary}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(d.savedAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => {
                            setSessionPreview({ payload: d.payload });
                            toast.message("임시 저장본을 불러왔습니다.");
                          }}
                        >
                          <FolderOpen className="size-3.5" />
                          불러오기
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => {
                            removeLocalDetailDraft(d.id);
                            setDraftListTick((t) => t + 1);
                          }}
                        >
                          삭제
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                이번에 만든 결과만 표시됩니다. PNG는 왼쪽에서 수정한 내용
                기준으로 생성됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {sessionPreview ? (
                <iframe
                  key={sessionPreview.payload.createdAt}
                  title="preview"
                  className="h-[min(78vh,920px)] w-full bg-muted/30"
                  srcDoc={previewHtml}
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
        </div>
      </div>
    </div>
  );
}
