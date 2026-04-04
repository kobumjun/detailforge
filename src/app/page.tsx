import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  ImageIcon,
  Layers,
  Sparkles,
  Wand2,
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
    title: "설명만으로 구조 잡기",
    body: "상품 카피를 넣으면 헤드라인·혜택·시나리오·CTA까지 상세페이지 흐름을 자동 배치합니다.",
    icon: Layers,
  },
  {
    title: "사진 업로드 & AI 보강",
    body: "직접 촬영한 이미지를 올리거나, 부족한 구간은 AI 이미지로 채우는 하이브리드 옵션을 지원합니다.",
    icon: ImageIcon,
  },
  {
    title: "PNG로 바로보내기",
    body: "브라우저 장난이 아니라 서버에서 HTML을 렌더해 긴 세로형 PNG 파일로 저장·다운로드합니다.",
    icon: Download,
  },
  {
    title: "크레딧 기반 과금 구조",
    body: "생성 1회 1크레딧. 가입 시 3크레딧 지급. 결제 프로바이더만 바꿔 붙이면 바로 유료화할 수 있습니다.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-lg">
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
              회원가입
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
            AI 상세페이지 스튜디오
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.08]">
            몇 분 만에 완성하는
            <span className="block bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              프리미엄 상품 상세페이지
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            카피와 이미지를 연결하고, 세로형 레이아웃으로 바로 PNG까지. DetailForge는
            실제로 판매 가능한 결과물을 목표로 설계되었습니다.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex items-center gap-2 rounded-full px-6",
              )}
            >
              무료로 시작하기
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full px-6",
              )}
            >
              로그인
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            회원가입 시 3크레딧 · 생성 1회당 1크레딧
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            판매 페이지를 데이터가 아니라 디자인으로
          </h2>
          <p className="mt-3 text-muted-foreground">
            단순 텍스트 덤프가 아니라, 섹션별 비주얼이 갖춰진 롱폼 상세페이지를
            만듭니다.
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
                  <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">
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
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              예시 목업
            </h2>
            <p className="mt-3 text-muted-foreground">
              템플릿은 Aurora · Minimal · Editorial 세 가지. 톤과 색감에 맞춰
              카드형 섹션이 자동으로 이어집니다.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["히어로 + 핵심 이미지", "혜택 교차 배치", "사용 시나리오", "구매 유도 CTA"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-foreground/10">
                      <Check className="size-3" />
                    </span>
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <Card className="overflow-hidden border-border/80 shadow-lg">
            <div className="border-b border-border/60 bg-card px-6 py-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Wand2 className="size-3.5" />
                Preview
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
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            크레딧 & 요금
          </h2>
          <p className="mt-3 text-muted-foreground">
            지금은 Mock 결제로 주문 레코드만 남기고, LemonSqueezy 등 프로바이더 키를
            넣으면 같은 UI에서 실결제로 전환됩니다.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "10", d: "가볍게 테스트" },
            { n: "30", d: "팀 단위 제작", highlight: true },
            { n: "100", d: "대량·에이전시" },
          ].map((p) => (
            <Card
              key={p.n}
              className={`border-border/80 shadow-sm ${p.highlight ? "ring-1 ring-foreground/15" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{p.n} 크레딧</CardTitle>
                <CardDescription>{p.d}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  생성 {p.n}회 분량 · 패키지는 /billing 에서 선택
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
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
