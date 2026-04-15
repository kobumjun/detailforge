"use client";

import type {
  CommerceBlock,
  GenerationPayload,
  GenerationPayloadV1,
  GenerationPayloadV2,
  LegacyDetailSection,
} from "@/lib/generation/types";
import { isPayloadV2 } from "@/lib/generation/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

function clonePayload(p: GenerationPayload): GenerationPayload {
  return JSON.parse(JSON.stringify(p)) as GenerationPayload;
}

/** 한 줄 필드 배열 ↔ textarea: 빈 줄·맨 끝 줄바꿈 유지 (trim/filter 금지). */
export function linesFromMultiline(value: string): string[] {
  if (value === "") return [];
  return value.split("\n");
}

type Props = {
  payload: GenerationPayload;
  onChange: (next: GenerationPayload) => void;
};

function findBlockIndex(
  blocks: CommerceBlock[],
  type: CommerceBlock["type"],
): number {
  return blocks.findIndex((b) => b.type === type);
}

function replaceBlockAt(
  blocks: CommerceBlock[],
  index: number,
  next: CommerceBlock,
): CommerceBlock[] {
  return blocks.map((b, i) => (i === index ? next : b));
}

function replaceSectionAt(
  sections: LegacyDetailSection[],
  index: number,
  next: LegacyDetailSection,
): LegacyDetailSection[] {
  return sections.map((s, i) => (i === index ? next : s));
}

function V2Editor({
  payload,
  onChange,
}: {
  payload: GenerationPayloadV2;
  onChange: (next: GenerationPayload) => void;
}) {
  const heroIdx = findBlockIndex(payload.blocks, "hero_shelf");
  const checklistIdx = findBlockIndex(payload.blocks, "checklist_icons");
  const painIdx = findBlockIndex(payload.blocks, "pain_panel");
  const ctaIdx = findBlockIndex(payload.blocks, "cta_band");

  const heroBlock =
    heroIdx >= 0 && payload.blocks[heroIdx]?.type === "hero_shelf"
      ? payload.blocks[heroIdx]
      : null;
  const checklistBlock =
    checklistIdx >= 0 &&
    payload.blocks[checklistIdx]?.type === "checklist_icons"
      ? payload.blocks[checklistIdx]
      : null;
  const painBlock =
    painIdx >= 0 && payload.blocks[painIdx]?.type === "pain_panel"
      ? payload.blocks[painIdx]
      : null;
  const ctaBlock =
    ctaIdx >= 0 && payload.blocks[ctaIdx]?.type === "cta_band"
      ? payload.blocks[ctaIdx]
      : null;

  const emit = (next: GenerationPayloadV2) => {
    onChange(clonePayload(next));
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-2">
        <Label htmlFor="edit-productDescription">상품 설명 (요약)</Label>
        <Textarea
          id="edit-productDescription"
          rows={3}
          value={payload.options.productDescription}
          onChange={(e) =>
            emit({
              ...payload,
              options: {
                ...payload.options,
                productDescription: e.target.value,
              },
            })
          }
          className="resize-none"
        />
      </div>

      <Separator />

      {heroBlock ? (
        <div className="space-y-4">
          <p className="text-[12px] font-medium text-muted-foreground">
            히어로 영역
          </p>
          <div className="space-y-2">
            <Label htmlFor="edit-headline">메인 카피</Label>
            <Textarea
              id="edit-headline"
              rows={2}
              value={heroBlock.headline}
              onChange={(e) => {
                const nextBlock: CommerceBlock = {
                  ...heroBlock,
                  headline: e.target.value,
                };
                emit({
                  ...payload,
                  blocks: replaceBlockAt(payload.blocks, heroIdx, nextBlock),
                });
              }}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subcopy">서브 카피</Label>
            <Textarea
              id="edit-subcopy"
              rows={3}
              value={heroBlock.subcopy}
              onChange={(e) => {
                const nextBlock: CommerceBlock = {
                  ...heroBlock,
                  subcopy: e.target.value,
                };
                emit({
                  ...payload,
                  blocks: replaceBlockAt(payload.blocks, heroIdx, nextBlock),
                });
              }}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-badges">상단 배지 (한 줄에 하나)</Label>
            <Textarea
              id="edit-badges"
              rows={2}
              value={heroBlock.badges.join("\n")}
              onChange={(e) => {
                const badges = linesFromMultiline(e.target.value);
                const nextBlock: CommerceBlock = { ...heroBlock, badges };
                emit({
                  ...payload,
                  blocks: replaceBlockAt(payload.blocks, heroIdx, nextBlock),
                });
              }}
              className="resize-none font-mono text-[13px]"
              placeholder="예: 무료배송&#10;당일출고"
            />
          </div>
        </div>
      ) : null}

      {checklistBlock ? (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-[12px] font-medium text-muted-foreground">
              핵심 포인트 (체크리스트)
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-checklist-title">블록 제목</Label>
              <Input
                id="edit-checklist-title"
                value={checklistBlock.title}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...checklistBlock,
                    title: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(
                      payload.blocks,
                      checklistIdx,
                      nextBlock,
                    ),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-checklist-items">불릿 (한 줄에 하나)</Label>
              <Textarea
                id="edit-checklist-items"
                rows={5}
                value={checklistBlock.items.join("\n")}
                onChange={(e) => {
                  const items = linesFromMultiline(e.target.value);
                  const nextBlock: CommerceBlock = {
                    ...checklistBlock,
                    items,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(
                      payload.blocks,
                      checklistIdx,
                      nextBlock,
                    ),
                  });
                }}
                className="resize-none font-mono text-[13px]"
              />
            </div>
          </div>
        </>
      ) : painBlock ? (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-[12px] font-medium text-muted-foreground">
              핵심 메시지 (고민·문제 블록)
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-pain-title">제목</Label>
              <Input
                id="edit-pain-title"
                value={painBlock.title}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...painBlock,
                    title: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(payload.blocks, painIdx, nextBlock),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pain-body">본문</Label>
              <Textarea
                id="edit-pain-body"
                rows={4}
                value={painBlock.body}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...painBlock,
                    body: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(payload.blocks, painIdx, nextBlock),
                  });
                }}
                className="resize-none"
              />
            </div>
          </div>
        </>
      ) : null}

      {ctaBlock ? (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-[12px] font-medium text-muted-foreground">
              하단 CTA
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-cta-title">CTA 제목</Label>
              <Input
                id="edit-cta-title"
                value={ctaBlock.title}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...ctaBlock,
                    title: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(payload.blocks, ctaIdx, nextBlock),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cta-body">CTA 본문</Label>
              <Textarea
                id="edit-cta-body"
                rows={3}
                value={ctaBlock.body}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...ctaBlock,
                    body: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(payload.blocks, ctaIdx, nextBlock),
                  });
                }}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cta-btn">버튼 문구</Label>
              <Input
                id="edit-cta-btn"
                value={ctaBlock.buttonLabel}
                onChange={(e) => {
                  const nextBlock: CommerceBlock = {
                    ...ctaBlock,
                    buttonLabel: e.target.value,
                  };
                  emit({
                    ...payload,
                    blocks: replaceBlockAt(payload.blocks, ctaIdx, nextBlock),
                  });
                }}
              />
            </div>
          </div>
        </>
      ) : null}

      {!heroBlock && !checklistBlock && !painBlock && !ctaBlock ? (
        <p className="text-[13px] text-muted-foreground">
          이 결과에서는 편집 가능한 텍스트 블록을 찾지 못했습니다.
        </p>
      ) : null}
    </div>
  );
}

function V1Editor({
  payload,
  onChange,
}: {
  payload: GenerationPayloadV1;
  onChange: (next: GenerationPayload) => void;
}) {
  const heroIdx = payload.sections.findIndex((s) => s.kind === "hero");
  const featureIdx = payload.sections.findIndex((s) => s.kind === "feature");
  const ctaIdx = payload.sections.findIndex((s) => s.kind === "cta");

  const hero =
    heroIdx >= 0 && payload.sections[heroIdx]?.kind === "hero"
      ? payload.sections[heroIdx]
      : null;
  const feature =
    featureIdx >= 0 && payload.sections[featureIdx]?.kind === "feature"
      ? payload.sections[featureIdx]
      : null;
  const cta =
    ctaIdx >= 0 && payload.sections[ctaIdx]?.kind === "cta"
      ? payload.sections[ctaIdx]
      : null;

  const emit = (next: GenerationPayloadV1) => {
    onChange(clonePayload(next));
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-2">
        <Label htmlFor="edit-v1-productDescription">상품 설명 (요약)</Label>
        <Textarea
          id="edit-v1-productDescription"
          rows={3}
          value={payload.options.productDescription}
          onChange={(e) =>
            emit({
              ...payload,
              options: {
                ...payload.options,
                productDescription: e.target.value,
              },
            })
          }
          className="resize-none"
        />
      </div>

      <Separator />

      {hero ? (
        <div className="space-y-4">
          <p className="text-[12px] font-medium text-muted-foreground">
            히어로
          </p>
          <div className="space-y-2">
            <Label htmlFor="edit-v1-headline">메인 카피</Label>
            <Textarea
              id="edit-v1-headline"
              rows={2}
              value={hero.headline}
              onChange={(e) => {
                const next: LegacyDetailSection = {
                  ...hero,
                  headline: e.target.value,
                };
                emit({
                  ...payload,
                  sections: replaceSectionAt(
                    payload.sections,
                    heroIdx,
                    next,
                  ),
                });
              }}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-v1-subcopy">서브 카피</Label>
            <Textarea
              id="edit-v1-subcopy"
              rows={3}
              value={hero.subcopy}
              onChange={(e) => {
                const next: LegacyDetailSection = {
                  ...hero,
                  subcopy: e.target.value,
                };
                emit({
                  ...payload,
                  sections: replaceSectionAt(
                    payload.sections,
                    heroIdx,
                    next,
                  ),
                });
              }}
              className="resize-none"
            />
          </div>
        </div>
      ) : null}

      {feature ? (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-[12px] font-medium text-muted-foreground">
              핵심 포인트 (피처 블록)
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-v1-feature-title">제목</Label>
              <Input
                id="edit-v1-feature-title"
                value={feature.title}
                onChange={(e) => {
                  const next: LegacyDetailSection = {
                    ...feature,
                    title: e.target.value,
                  };
                  emit({
                    ...payload,
                    sections: replaceSectionAt(
                      payload.sections,
                      featureIdx,
                      next,
                    ),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-v1-feature-body">본문</Label>
              <Textarea
                id="edit-v1-feature-body"
                rows={4}
                value={feature.body}
                onChange={(e) => {
                  const next: LegacyDetailSection = {
                    ...feature,
                    body: e.target.value,
                  };
                  emit({
                    ...payload,
                    sections: replaceSectionAt(
                      payload.sections,
                      featureIdx,
                      next,
                    ),
                  });
                }}
                className="resize-none"
              />
            </div>
          </div>
        </>
      ) : null}

      {cta ? (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-[12px] font-medium text-muted-foreground">CTA</p>
            <div className="space-y-2">
              <Label htmlFor="edit-v1-cta-title">CTA 제목</Label>
              <Input
                id="edit-v1-cta-title"
                value={cta.title}
                onChange={(e) => {
                  const next: LegacyDetailSection = {
                    ...cta,
                    title: e.target.value,
                  };
                  emit({
                    ...payload,
                    sections: replaceSectionAt(
                      payload.sections,
                      ctaIdx,
                      next,
                    ),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-v1-cta-body">CTA 본문</Label>
              <Textarea
                id="edit-v1-cta-body"
                rows={3}
                value={cta.body}
                onChange={(e) => {
                  const next: LegacyDetailSection = {
                    ...cta,
                    body: e.target.value,
                  };
                  emit({
                    ...payload,
                    sections: replaceSectionAt(
                      payload.sections,
                      ctaIdx,
                      next,
                    ),
                  });
                }}
                className="resize-none"
              />
            </div>
            <p className="text-[12px] text-muted-foreground">
              레거시 템플릿의 버튼 문구는 고정입니다.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function DetailTextEditor({ payload, onChange }: Props) {
  if (isPayloadV2(payload)) {
    return <V2Editor payload={payload} onChange={onChange} />;
  }
  return <V1Editor payload={payload} onChange={onChange} />;
}
