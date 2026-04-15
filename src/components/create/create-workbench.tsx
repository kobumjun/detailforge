"use client";

import type { CSSProperties } from "react";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FolderOpen,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
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
  type LocalDetailDraft,
} from "@/lib/create/local-detail-drafts";
import { applyVariantPreset } from "@/lib/create/generation-presets";
import type { VariantPresetId } from "@/lib/create/generation-presets";
import { buildGenerationSummaryLines } from "@/lib/create/generation-summary";
import { DetailTextEditor } from "@/components/create/detail-text-editor";
import { ResultInlineEditor } from "@/components/create/result-inline-editor";
import { CreatePreviewEmpty } from "@/components/create/create-preview-empty";
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
import type { TemplateId } from "@/lib/generation/types";
import type { DetailLength, ToneOption } from "@/lib/providers/text-gen/types";

type CreditLogRow = {
  id: string;
  amount: number;
  type: string;
  reason: string | null;
  created_at: string;
};

type FormValues = {
  productDescription: string;
  targetCustomer: string;
  tone: ToneOption;
  colorHint: string;
  sellingPoints: string;
  template: TemplateId;
  length: DetailLength;
  aiFillImages: boolean;
  quickMode: boolean;
};

const defaultForm: FormValues = {
  productDescription: "",
  targetCustomer: "",
  tone: "premium",
  colorHint: "",
  sellingPoints: "",
  template: "aurora",
  length: "medium",
  aiFillImages: false,
  quickMode: true,
};

const VARIANT_ACTIONS: { id: VariantPresetId; label: string }[] = [
  { id: "simple_tone", label: "심플 톤으로" },
  { id: "premium_tone", label: "프리미엄 톤으로" },
  { id: "strong_cta", label: "CTA 강한 버전" },
  { id: "female_target", label: "여성 타겟형" },
  { id: "gift_set", label: "선물세트형" },
  { id: "smartstore", label: "스마트스토어형" },
  { id: "coupang", label: "쿠팡형" },
];

function creditLogLabel(reason: string | null, type: string) {
  if (reason === "signup_bonus") return "가입 축하 크레딧";
  if (reason === "generation") return "상세페이지 생성";
  if (reason === "generation_failed") return "생성 실패 환불";
  if (type === "refund") return "크레딧 환불";
  if (type === "consume") return "크레딧 사용";
  if (reason) return reason;
  return type;
}

function duplicatePayload(p: GenerationPayload): GenerationPayload {
  const c = structuredClone(p) as GenerationPayload;
  const ts = new Date().toISOString();
  if ("version" in c && c.version === 2) {
    (c as { createdAt: string }).createdAt = ts;
  } else {
    (c as { createdAt: string }).createdAt = ts;
  }
  return c;
}

function hydrateFormFromOptions(setFv: (f: FormValues | ((p: FormValues) => FormValues)) => void, p: GenerationPayload) {
  const o = p.options;
  setFv(() => ({
    productDescription: o.productDescription,
    targetCustomer: o.targetCustomer ?? "",
    tone: o.tone,
    colorHint: o.colorHint ?? "",
    sellingPoints: o.sellingPoints ?? "",
    template: o.template,
    length: o.length,
    aiFillImages: o.aiFillImages,
    quickMode: false,
  }));
}

function syncFilesToInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  try {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
  } catch {
    /* DataTransfer 미지원 시 순서 변경 생략 */
  }
}

type ZoomKey = "fit" | 0.5 | 0.75 | 1;

export function CreateWorkbench({ creditLogs }: { creditLogs: CreditLogRow[] }) {
  const [fv, setFv] = useState<FormValues>(defaultForm);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<{
    payload: GenerationPayload;
  } | null>(null);
  const [draftListTick, setDraftListTick] = useState(0);
  const [pendingPreset, setPendingPreset] = useState("");
  const lastSubmittedPresetRef = useRef<string>("");
  const [lastSummary, setLastSummary] = useState<string[] | null>(null);
  const [iframeHeight, setIframeHeight] = useState(1400);
  const [zoomMode, setZoomMode] = useState<ZoomKey>("fit");
  const [fitScale, setFitScale] = useState(1);
  const zoomWrapRef = useRef<HTMLDivElement>(null);

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
    if (!sessionPreview) return;
    let ro: ResizeObserver | null = null;
    const t = window.setTimeout(() => {
      const el = zoomWrapRef.current;
      if (!el) return;
      ro = new ResizeObserver(() => {
        const w = el.clientWidth || 800;
        setFitScale(Math.min(1, Math.max(0.35, (w - 24) / 800)));
      });
      ro.observe(el);
    }, 0);
    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
    };
  }, [sessionPreview, previewHtml]);

  useEffect(() => {
    if (!state) return;
    setPendingPreset("");
    if (state.ok) {
      toast.success("초안이 준비되었습니다. 새로고침하면 이 세션은 사라집니다.");
      setSessionPreview({ payload: state.payload });
      const o = state.payload.options;
      setLastSummary(
        buildGenerationSummaryLines(state.payload, {
          tone: o.tone,
          length: o.length,
          template: o.template,
          imageCount: o.userImageUrls?.length ?? 0,
          aiFillImages: o.aiFillImages,
          preset: lastSubmittedPresetRef.current || undefined,
        }),
      );
      lastSubmittedPresetRef.current = "";
      startTransition(() => {
        setPreviews([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
    } else {
      toast.error(state.message);
      lastSubmittedPresetRef.current = "";
    }
  }, [state]);

  const handlePayloadChange = useCallback((next: GenerationPayload) => {
    setSessionPreview({ payload: next });
  }, []);

  const localDrafts = useMemo(
    () => listLocalDetailDrafts(),
    [sessionPreview, draftListTick],
  );

  const effectiveZoom = zoomMode === "fit" ? fitScale : zoomMode;

  const currentStep = useMemo(() => {
    if (sessionPreview) return 5;
    const hasDesc = fv.productDescription.trim().length > 0;
    if (!hasDesc) return 1;
    if (fv.quickMode) {
      if (previews.length < 1) return 3;
      return 4;
    }
    return 4;
  }, [sessionPreview, fv.productDescription, fv.quickMode, previews.length]);

  const canSubmitGeneration = useCallback(() => {
    if (!fv.productDescription.trim()) {
      toast.error("상품 설명을 입력해 주세요.");
      return false;
    }
    if (fv.quickMode) {
      if (!fv.targetCustomer.trim()) {
        toast.error("빠른 모드에서는 타겟 고객을 입력해 주세요.");
        return false;
      }
      if (previews.length < 1 && !fv.aiFillImages) {
        toast.error(
          "빠른 모드: 사진을 다시 올리거나 비주얼 자동 보완을 켜 주세요. (생성 후에는 파일이 비워집니다)",
        );
        return false;
      }
    }
    return true;
  }, [fv, previews.length]);

  const submitForm = useCallback(() => {
    if (!canSubmitGeneration()) return;
    formRef.current?.requestSubmit();
  }, [canSubmitGeneration]);

  const runVariant = useCallback(
    (preset: VariantPresetId) => {
      if (!canSubmitGeneration()) return;
      const p = applyVariantPreset(preset, {
        tone: fv.tone,
        targetCustomer: fv.targetCustomer.trim() || undefined,
        sellingPoints: fv.sellingPoints.trim() || undefined,
        colorHint: fv.colorHint.trim() || undefined,
        length: fv.length,
        template: fv.template,
      });
      flushSync(() => {
        setFv((prev) => ({
          ...prev,
          tone: p.tone,
          length: p.length,
          template: p.template,
          targetCustomer: p.targetCustomer ?? prev.targetCustomer,
          sellingPoints: p.sellingPoints ?? prev.sellingPoints,
          colorHint: p.colorHint ?? prev.colorHint,
        }));
        setPendingPreset(preset);
        lastSubmittedPresetRef.current = preset;
      });
      queueMicrotask(() => formRef.current?.requestSubmit());
    },
    [fv, canSubmitGeneration],
  );

  const regenWithToneOnly = useCallback((tone: ToneOption) => {
    if (!canSubmitGeneration()) return;
    flushSync(() => {
      setFv((prev) => ({ ...prev, tone }));
      setPendingPreset("");
      lastSubmittedPresetRef.current = "";
    });
    queueMicrotask(() => formRef.current?.requestSubmit());
  }, [canSubmitGeneration]);

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
      queueMicrotask(() => syncFilesToInput(fileInputRef.current, next.map((x) => x.file)));
      return next;
    });
  }

  function movePreview(i: number, delta: number) {
    setPreviews((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      queueMicrotask(() =>
        syncFilesToInput(
          fileInputRef.current,
          next.map((x) => x.file),
        ),
      );
      return next;
    });
  }

  function handleDuplicateSession() {
    if (!sessionPreview) return;
    setSessionPreview({ payload: duplicatePayload(sessionPreview.payload) });
    toast.success("복제본을 불러왔습니다. 이어서 수정해 보세요.");
  }

  function handleLoadDraftContinue(d: LocalDetailDraft) {
    setSessionPreview({ payload: d.payload });
    hydrateFormFromOptions(setFv, d.payload);
    toast.message("이어서 수정합니다.");
  }

  function handleDraftDuplicate(d: LocalDetailDraft) {
    setSessionPreview({ payload: duplicatePayload(d.payload) });
    hydrateFormFromOptions(setFv, d.payload);
    toast.success("복제해 편집 화면을 열었습니다.");
  }

  function handleDraftRegenTone(d: LocalDetailDraft) {
    hydrateFormFromOptions(setFv, d.payload);
    setSessionPreview(null);
    setLastSummary(null);
    flushSync(() => {
      setFv((prev) => ({ ...prev, tone: "premium" }));
      setPendingPreset("premium_tone");
      lastSubmittedPresetRef.current = "premium_tone";
    });
    toast.message("이미지를 다시 올린 뒤 「1차 시안 만들기」를 눌러 주세요. (크레딧 1)");
    queueMicrotask(() => fileInputRef.current?.click());
  }

  function handleDraftImageReplace(d: LocalDetailDraft) {
    hydrateFormFromOptions(setFv, d.payload);
    setSessionPreview(null);
    setLastSummary(null);
    fileInputRef.current?.click();
    toast.message("새 사진을 올린 뒤 초안 생성을 눌러 주세요.");
  }

  const steps = [
    { n: 1, t: "상품·타겟" },
    { n: 2, t: "톤·강조" },
    { n: 3, t: "이미지" },
    { n: 4, t: "초안 생성" },
    { n: 5, t: "수정·저장" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
              상세페이지 만들기
            </h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              필수만으로 초안을 받고, 결과를 보며 고치고, 톤·형태를 바꿔 여러
              버전을 뽑는 흐름입니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
          {steps.map((s) => (
            <div
              key={s.n}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                currentStep === s.n
                  ? "bg-background text-foreground shadow-sm"
                  : currentStep > s.n
                    ? "text-muted-foreground"
                    : "text-muted-foreground/70",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px]",
                  currentStep >= s.n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground",
                )}
              >
                {currentStep > s.n ? "✓" : s.n}
              </span>
              {s.t}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-5">
          <Card className="border-primary/25 shadow-sm ring-1 ring-primary/10">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-[15px] font-semibold tracking-tight">
                  최근 작업 · 임시 보관
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  이 기기 최대 2개
                </Badge>
              </div>
              <CardDescription className="text-[12px] leading-relaxed">
                다시 쓰는 입구입니다. 복제·톤 변경·이미지 교체로 바로 이어갈 수
                있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionPreview ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      const ok = saveLocalDetailDraft(sessionPreview.payload);
                      setDraftListTick((t) => t + 1);
                      toast[ok ? "success" : "error"](
                        ok
                          ? "임시 저장했습니다."
                          : "저장에 실패했습니다.",
                      );
                    }}
                  >
                    현재 결과 저장
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={handleDuplicateSession}
                  >
                    <Copy className="size-3.5" />
                    복제해서 수정
                  </Button>
                </div>
              ) : null}
              {localDrafts.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  아직 임시 저장된 작업이 없습니다. 생성 후 저장해 두면 여기에
                  쌓입니다.
                </p>
              ) : (
                <ul className="space-y-3">
                  {localDrafts.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-lg border border-border/70 bg-background/80 p-3"
                    >
                      <div className="mb-2 min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {d.summary}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(d.savedAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="h-8 gap-1 text-[11px]"
                          onClick={() => handleLoadDraftContinue(d)}
                        >
                          <FolderOpen className="size-3" />
                          이어서 수정
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 text-[11px]"
                          onClick={() => handleDraftDuplicate(d)}
                        >
                          복제
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-[11px]"
                          onClick={() => handleDraftRegenTone(d)}
                        >
                          <Wand2 className="size-3" />
                          톤 바꿔 재생성
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-[11px]"
                          onClick={() => handleDraftImageReplace(d)}
                        >
                          <ImagePlus className="size-3" />
                          이미지 교체
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[11px] text-muted-foreground"
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
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-[15px] font-semibold tracking-tight">
                    새로 만들기
                  </CardTitle>
                  <CardDescription className="text-[13px] leading-relaxed">
                    <span className="font-medium text-foreground">빠른 모드</span>
                    는 상품 설명·타겟·사진만으로 초안을 띄웁니다. 나머지는 고급
                    설정에서 조정합니다.
                  </CardDescription>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={fv.quickMode}
                    onChange={(e) =>
                      setFv((p) => ({ ...p, quickMode: e.target.checked }))
                    }
                    className="size-4 rounded border-input"
                  />
                  빠른 생성 모드
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <form ref={formRef} action={formAction} className="space-y-6">
                <input
                  type="hidden"
                  name="generationMode"
                  value={fv.quickMode ? "quick" : "full"}
                />
                <input type="hidden" name="preset" value={pendingPreset} />

                <div className="rounded-lg border-2 border-primary/30 bg-primary/[0.04] p-4 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Step 1 · 필수
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="productDescription" className="gap-1">
                      상품 설명
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="productDescription"
                      name="productDescription"
                      required
                      rows={4}
                      value={fv.productDescription}
                      onChange={(e) =>
                        setFv((p) => ({
                          ...p,
                          productDescription: e.target.value,
                        }))
                      }
                      placeholder="예: 고단백 닭가슴살 소시지, 프리미엄 강아지 간식"
                      className="resize-none bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetCustomer">
                      타겟 고객
                      {fv.quickMode ? (
                        <span className="text-destructive">*</span>
                      ) : null}
                    </Label>
                    <Input
                      id="targetCustomer"
                      name="targetCustomer"
                      value={fv.targetCustomer}
                      onChange={(e) =>
                        setFv((p) => ({ ...p, targetCustomer: e.target.value }))
                      }
                      placeholder="예: 직장인 20–40대, 반려견 보호자"
                      className="bg-background"
                      required={fv.quickMode}
                    />
                    {fv.quickMode ? (
                      <p className="text-[11px] text-muted-foreground">
                        빠른 모드에서 초안 방향을 잡는 데 필요합니다.
                      </p>
                    ) : null}
                  </div>
                </div>

                <details className="group rounded-lg border border-dashed border-border/80 bg-muted/10">
                  <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      Step 2 · 고급 설정 (톤·강조·템플릿)
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground group-open:hidden" />
                      <ChevronUp className="size-4 hidden shrink-0 text-muted-foreground group-open:block" />
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="tone">톤 / 무드</Label>
                        <select
                          id="tone"
                          name="tone"
                          value={fv.tone}
                          onChange={(e) =>
                            setFv((p) => ({
                              ...p,
                              tone: e.target.value as ToneOption,
                            }))
                          }
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
                          value={fv.length}
                          onChange={(e) =>
                            setFv((p) => ({
                              ...p,
                              length: e.target.value as DetailLength,
                            }))
                          }
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
                        value={fv.colorHint}
                        onChange={(e) =>
                          setFv((p) => ({ ...p, colorHint: e.target.value }))
                        }
                        placeholder="예: 딥 네이비 + 골드 포인트"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPoints">강조 포인트 (선택)</Label>
                      <Textarea
                        id="sellingPoints"
                        name="sellingPoints"
                        rows={2}
                        value={fv.sellingPoints}
                        onChange={(e) =>
                          setFv((p) => ({
                            ...p,
                            sellingPoints: e.target.value,
                          }))
                        }
                        placeholder="예: 국내산 원료, 당일 발송, 무첨가"
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template">템플릿</Label>
                      <select
                        id="template"
                        name="template"
                        value={fv.template}
                        onChange={(e) =>
                          setFv((p) => ({
                            ...p,
                            template: e.target.value as TemplateId,
                          }))
                        }
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
                  </div>
                </details>

                <div className="rounded-lg border border-border/80 bg-muted/15 p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Step 3 · 이미지
                  </p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {fv.quickMode
                      ? "빠른 모드: 상품 사진을 1장 이상 올려 주세요. 순서는 메인 → 이후 섹션에 반영됩니다."
                      : "여러 장을 올리면 앞에서부터 메인·섹션에 순서대로 배치됩니다."}
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
                        <div
                          key={`${p.url}-${i}`}
                          className="relative flex flex-col items-center gap-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt=""
                            className="h-20 w-20 rounded-lg border object-contain bg-background"
                          />
                          <div className="flex gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={i === 0}
                              onClick={() => movePreview(i, -1)}
                              aria-label="위로"
                            >
                              <ChevronUp className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={i === previews.length - 1}
                              onClick={() => movePreview(i, 1)}
                              aria-label="아래로"
                            >
                              <ChevronDown className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-background/60 p-3">
                    <input
                      type="checkbox"
                      id="aiFillImages"
                      name="aiFillImages"
                      value="on"
                      checked={fv.aiFillImages}
                      onChange={(e) =>
                        setFv((p) => ({
                          ...p,
                          aiFillImages: e.target.checked,
                        }))
                      }
                      className="mt-1 size-4 rounded border-input"
                    />
                    <div>
                      <Label htmlFor="aiFillImages" className="cursor-pointer font-medium">
                        비주얼 자동 보완
                      </Label>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">
                        업로드가 부족할 때 빈 영역을 채웁니다. 빠른 모드에서
                        사진이 없으면 켜고 시도할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-muted-foreground">
                    Step 4 · 크레딧 1이 사용됩니다.
                  </p>
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => {
                      lastSubmittedPresetRef.current =
                        pendingPreset.trim() || "";
                    }}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        초안 만드는 중…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        1차 시안 만들기 · 1크레딧
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {sessionPreview ? (
            <details className="rounded-lg border border-border/80 bg-card shadow-sm">
              <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium">
                전체 텍스트 편집 (고급)
              </summary>
              <div className="border-t border-border/60 p-4">
                <DetailTextEditor
                  payload={sessionPreview.payload}
                  onChange={handlePayloadChange}
                />
              </div>
            </details>
          ) : null}

          <details className="rounded-lg border border-border/60 bg-muted/10">
            <summary className="cursor-pointer px-4 py-2.5 text-[12px] font-medium text-muted-foreground">
              크레딧 내역 ({creditLogs.length})
            </summary>
            <div className="max-h-48 space-y-1.5 overflow-y-auto border-t border-border/50 px-3 py-2">
              {creditLogs.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">기록이 없습니다.</p>
              ) : (
                creditLogs.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/80 px-2 py-1.5"
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {creditLogLabel(l.reason, l.type)}
                    </span>
                    <Badge
                      variant={l.amount < 0 ? "destructive" : "secondary"}
                      className="tabular-nums text-[10px]"
                    >
                      {l.amount > 0 ? `+${l.amount}` : l.amount}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-card pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-[15px] font-semibold tracking-tight">
                    미리보기
                  </CardTitle>
                  <CardDescription className="text-[12px] leading-relaxed">
                    세로로 긴 페이지입니다. 스크롤·줌으로 전체를 확인하세요.
                  </CardDescription>
                </div>
                {sessionPreview ? (
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["fit", "맞춤"],
                        [0.5, "50%"],
                        [0.75, "75%"],
                        [1, "100%"],
                      ] as const
                    ).map(([z, lab]) => (
                      <Button
                        key={String(z)}
                        type="button"
                        size="sm"
                        variant={zoomMode === z ? "default" : "outline"}
                        className="h-7 px-2 text-[10px]"
                        onClick={() => setZoomMode(z)}
                      >
                        {lab}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardHeader>

            {sessionPreview && lastSummary && lastSummary.length > 0 ? (
              <div className="border-b border-border/60 bg-muted/25 px-4 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  이번 초안 요약
                </p>
                <ul className="mt-1 list-inside list-disc text-[12px] leading-relaxed text-foreground">
                  {lastSummary.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {sessionPreview ? (
              <div className="space-y-3 border-b border-border/60 p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    disabled={exportingPng}
                    onClick={() => void handleExportPng()}
                  >
                    {exportingPng ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    PNG 저장
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={pending}
                    onClick={submitForm}
                  >
                    <RefreshCw className="size-3.5" />
                    다시 생성
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleDuplicateSession}
                  >
                    <Copy className="size-3.5" />
                    복제
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const ok = saveLocalDetailDraft(sessionPreview.payload);
                      setDraftListTick((t) => t + 1);
                      toast[ok ? "success" : "error"](
                        ok ? "저장했습니다." : "저장 실패",
                      );
                    }}
                  >
                    저장
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="w-full text-[10px] font-medium text-muted-foreground">
                    톤만 바꿔 재생성
                  </span>
                  {(
                    [
                      ["minimal", "미니멀"],
                      ["premium", "프리미엄"],
                      ["emotional", "감성"],
                    ] as const
                  ).map(([tone, lab]) => (
                    <Button
                      key={tone}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      disabled={pending}
                      onClick={() => regenWithToneOnly(tone)}
                    >
                      {lab}
                    </Button>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                    빠른 변형 (크레딧 1 · 옵션 반영 후 생성)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {VARIANT_ACTIONS.map(({ id, label }) => (
                      <Button
                        key={id}
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-[10px]"
                        disabled={pending}
                        onClick={() => runVariant(id)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {sessionPreview ? (
              <div className="border-b border-border/60 bg-muted/15 px-4 py-3">
                <p className="mb-2 text-[12px] font-medium text-foreground">
                  미리보기에서 바로 수정
                </p>
                <ResultInlineEditor
                  payload={sessionPreview.payload}
                  onChange={handlePayloadChange}
                />
              </div>
            ) : null}

            <CardContent className="p-0">
              <div
                ref={previewScrollRef}
                className="max-h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden"
              >
                {sessionPreview ? (
                  <div ref={zoomWrapRef} className="flex justify-center p-3">
                    <div
                      style={
                        {
                          zoom: effectiveZoom,
                        } as CSSProperties
                      }
                      className="origin-top"
                    >
                      <iframe
                        key={sessionPreview.payload.createdAt}
                        title="preview"
                        className="block w-[800px] max-w-none border-0 bg-muted/30"
                        style={{ height: iframeHeight, minHeight: 400 }}
                        srcDoc={previewHtml}
                        onLoad={(e) => {
                          const doc = e.currentTarget.contentDocument;
                          const h =
                            doc?.documentElement?.scrollHeight ??
                            doc?.body?.scrollHeight ??
                            1200;
                          setIframeHeight(Math.min(Math.max(h + 48, 400), 20000));
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <CreatePreviewEmpty />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
