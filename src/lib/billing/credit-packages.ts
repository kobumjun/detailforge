/** KG이니시스 직접 결제·서버 검증용 단일 소스 (KRW, 부가세 포함 금액) */
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
    description: "먼저 써보기 좋은 분량",
    credits: 20,
    amountKrw: 19_900,
  },
  plus_50: {
    id: "plus_50",
    label: "스탠다드",
    description: "팀·스튜디오용",
    credits: 50,
    amountKrw: 39_900,
  },
  pro_100: {
    id: "pro_100",
    label: "프로",
    description: "대량 제작·에이전시",
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
