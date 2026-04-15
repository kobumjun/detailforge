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
import { linesFromMultiline } from "@/components/create/detail-text-editor";

function clonePayload(p: GenerationPayload): GenerationPayload {
  return JSON.parse(JSON.stringify(p)) as GenerationPayload;
}

function replaceBlockAt(
  blocks: CommerceBlock[],
  index: number,
  next: CommerceBlock,
): CommerceBlock[] {
  return blocks.map((b, i) => (i === index ? next : b));
}

function findBlockIndex(
  blocks: CommerceBlock[],
  type: CommerceBlock["type"],
): number {
  return blocks.findIndex((b) => b.type === type);
}

function replaceSectionAt(
  sections: LegacyDetailSection[],
  index: number,
  next: LegacyDetailSection,
): LegacyDetailSection[] {
  return sections.map((s, i) => (i === index ? next : s));
}

type Props = {
  payload: GenerationPayload;
  onChange: (next: GenerationPayload) => void;
};

function V2Quick({
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

  const emit = (next: GenerationPayloadV2) => onChange(clonePayload(next));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {heroBlock ? (
        <>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">메인 제목</Label>
            <Textarea
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
              className="resize-none text-[13px]"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">배지 (줄바꿈)</Label>
            <Textarea
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
              className="resize-none font-mono text-[12px]"
            />
          </div>
        </>
      ) : null}
      {checklistBlock ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[11px] text-muted-foreground">핵심 불릿</Label>
          <Textarea
            rows={4}
            value={checklistBlock.items.join("\n")}
            onChange={(e) => {
              const items = linesFromMultiline(e.target.value);
              const nextBlock: CommerceBlock = { ...checklistBlock, items };
              emit({
                ...payload,
                blocks: replaceBlockAt(
                  payload.blocks,
                  checklistIdx,
                  nextBlock,
                ),
              });
            }}
            className="resize-none font-mono text-[12px]"
          />
        </div>
      ) : painBlock ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[11px] text-muted-foreground">핵심 문단</Label>
          <Textarea
            rows={3}
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
            className="resize-none text-[13px]"
          />
        </div>
      ) : null}
      {ctaBlock ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">CTA 제목</Label>
            <Input
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
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">버튼 문구</Label>
            <Input
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
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">CTA 본문</Label>
            <Textarea
              rows={2}
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
              className="resize-none text-[13px]"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function V1Quick({
  payload,
  onChange,
}: {
  payload: GenerationPayloadV1;
  onChange: (next: GenerationPayload) => void;
}) {
  const heroIdx = payload.sections.findIndex((s) => s.kind === "hero");
  const ctaIdx = payload.sections.findIndex((s) => s.kind === "cta");
  const hero =
    heroIdx >= 0 && payload.sections[heroIdx]?.kind === "hero"
      ? payload.sections[heroIdx]
      : null;
  const cta =
    ctaIdx >= 0 && payload.sections[ctaIdx]?.kind === "cta"
      ? payload.sections[ctaIdx]
      : null;

  const emit = (next: GenerationPayloadV1) => onChange(clonePayload(next));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {hero ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[11px] text-muted-foreground">메인 제목</Label>
          <Textarea
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
            className="resize-none text-[13px]"
          />
        </div>
      ) : null}
      {cta ? (
        <>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">CTA 제목</Label>
            <Input
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
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">CTA 본문</Label>
            <Textarea
              rows={2}
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
              className="resize-none text-[13px]"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ResultInlineEditor({ payload, onChange }: Props) {
  if (isPayloadV2(payload)) {
    return <V2Quick payload={payload} onChange={onChange} />;
  }
  return <V1Quick payload={payload} onChange={onChange} />;
}
