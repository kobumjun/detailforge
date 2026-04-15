/** 충전 패키지 정의 — 결제 연동·서버 검증용 단일 소스 (KRW, 부가세 포함 금액) */
export type CreditPackageId = "basic_20" | "plus_50" | "pro_100";

export type CreditPackageDef = {
  id: CreditPackageId;
  label: string;
  description: string;
  credits: number;
  /** 실제 청구 금액(원) */
  amountKrw: number;
};

export const CREDIT_PACKAGES: Record<CreditPackageId, CreditPackageDef> = {
  basic_20: {
    id: "basic_20",
    label: "라이트",
    description: "처음 써보기 · 소량 테스트에 적은 분량",
    credits: 20,
    amountKrw: 19_900,
  },
  plus_50: {
    id: "plus_50",
    label: "스탠다드",
    description: "여러 상품을 자주 만드는 분께 추천",
    credits: 50,
    amountKrw: 39_900,
  },
  pro_100: {
    id: "pro_100",
    label: "프로",
    description: "다품목·반복 제작 · 팀·대행 용도",
    credits: 100,
    amountKrw: 69_000,
  },
};

export const CREDIT_PACKAGE_ORDER: CreditPackageId[] = [
  "basic_20",
  "plus_50",
  "pro_100",
];

export function isCreditPackageId(v: string): v is CreditPackageId {
  return v === "basic_20" || v === "plus_50" || v === "pro_100";
}
