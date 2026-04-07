import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  ImageIcon,
  Layers,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "카피만으로 섹션 구성",
    body: "상품 설명을 넣으면 헤드라인·혜택·사용 맥락·구매 유도까지, 판매 흐름에 맞춰 블록을 자동으로 배치합니다.",
    icon: Layers,
  },
  {
    title: "사진 업로드와 AI 보완",
    body: "직접 찍은 컷을 올리거나, 비어 있는 구간은 상품에 맞는 비주얼로 채울 수 있습니다.",
    icon: ImageIcon,
  },
  {
    title: "바로 쓰는 이미지 파일",
    body: "세로형 롱폼 레이아웃을 한 장의 이미지로 받아 쇼핑몰·SNS·기획안에 바로 활용하세요.",
    icon: Download,
  },
  {
    title: "크레딧으로 쓰는 만큼만",
    body: "생성 한 번에 크레딧 1회. 가입 시 제공되는 크레딧으로 먼저 경험해 보세요.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight">DetailForge</span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              로그인
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
              무료 시작
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.93_0.04_264/0.35),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <Badge
            variant="secondary"
            className="mb-6 border border-border/80 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-wide"
          >
            상세페이지 제작 스튜디오
          </Badge>
          <h1 className="max-w-[22ch] text-[2.125rem] font-bold leading-[1.12] tracking-[-0.035em] sm:text-5xl sm:leading-[1.08]">
            몇 분 만에 완성하는
            <span className="mt-1 block text-foreground/90">
              판매용 상품 상세페이지
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-muted-foreground sm:text-[17px] sm:leading-[1.7]">
            텍스트와 이미지를 정리하면 세로형 레이아웃이 만들어집니다. 기획부터
            시안 공유까지, 한 화면에서 끝내세요.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex items-center gap-2 rounded-full px-7 text-[15px] font-semibold",
              )}
            >
              무료로 시작하기
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full px-7 text-[15px] font-medium",
              )}
            >
              로그인
            </Link>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            회원가입 시 2크레딧 제공 · 상세페이지 1회 생성 시 1크레딧 사용
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-[1.625rem] font-bold leading-snug tracking-[-0.03em] sm:text-3xl">
            긴 상세페이지도 디자인으로 읽히게
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            문단만 나열하지 않고, 이미지와 텍스트가 번갈아 리듬을 만드는 롱폼
            구조를 지향합니다.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-border/80 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40">
                  <f.icon className="size-5 text-foreground/80" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-semibold leading-snug tracking-[-0.02em]">
                    {f.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-[14px] leading-relaxed">
                    {f.body}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:grid-cols-2 sm:px-6 sm:items-center">
          <div>
            <h2 className="text-[1.625rem] font-bold leading-snug tracking-[-0.03em] sm:text-3xl">
              레이아웃 미리보기
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Aurora, Minimal, Editorial 세 가지 톤 중에서 브랜드에 맞는 분위기를
              고를 수 있습니다.
            </p>
            <ul className="mt-6 space-y-3 text-[14px] leading-relaxed">
              {[
                "히어로 · 핵심 메시지",
                "혜택과 비주얼 교차",
                "사용 맥락 안내",
                "구매 유도 영역",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                    <Check className="size-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Card className="overflow-hidden border-border/80 shadow-lg">
            <div className="border-b border-border/60 bg-card px-6 py-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <LayoutTemplate className="size-3.5" />
                Sample layout
              </div>
            </div>
            <CardContent className="space-y-4 bg-gradient-to-b from-muted/30 to-background p-6">
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded bg-foreground/10" />
                <div className="h-3 w-full rounded bg-foreground/5" />
                <div className="h-3 w-5/6 rounded bg-foreground/5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square rounded-lg bg-foreground/5" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-foreground/10" />
                  <div className="h-3 w-full rounded bg-foreground/5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-[1.625rem] font-bold leading-snug tracking-[-0.03em] sm:text-3xl">
            크레딧 안내
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            사용한 만큼만 정산되는 구조입니다. 팀 단위·대량 제작이 필요하면 큰
            패키지를 선택하세요.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "10", d: "가볍게 시작" },
            { n: "30", d: "팀·스튜디오", highlight: true },
            { n: "100", d: "대량 제작" },
          ].map((p) => (
            <Card
              key={p.n}
              className={`border-border/80 shadow-sm ${p.highlight ? "ring-1 ring-foreground/12" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {p.n} 크레딧
                </CardTitle>
                <CardDescription className="text-[14px]">{p.d}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  상세페이지 약 {p.n}회 분량 · 충전은 앱 내 크레딧 메뉴에서
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-[13px] text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} DetailForge</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              회원가입
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
