import type { VisualCategoryKey } from "@/lib/generation/visual-category";

export interface CategoryVoice {
  trustStrip: { title: string; sub: string }[];
  painEyebrow: string;
  painTitle: string;
  recommendTitle: string;
  noticeTitle: string;
  compareColOurs: string;
  compareColTypical: string;
  quoteAuthorLabel: string;
  compositionDefault: string[];
}

const VOICES: Record<VisualCategoryKey, CategoryVoice> = {
  food: {
    trustStrip: [
      { title: "원료·성분", sub: "투명한 정보 공개" },
      { title: "유통기한", sub: "신선도 관리" },
      { title: "포장", sub: "안전 배송" },
    ],
    painEyebrow: "먹거리 고민",
    painTitle: "왜 이 제품이 필요한가요?",
    recommendTitle: "이런 분께 추천합니다",
    noticeTitle: "구매 전 꼭 확인하세요",
    compareColOurs: "이 상품",
    compareColTypical: "일반 선택",
    quoteAuthorLabel: "구매 고객",
    compositionDefault: ["본품", "구성 안내서", "안전 포장"],
  },
  beauty: {
    trustStrip: [
      { title: "성분", sub: "피부 타입 고려" },
      { title: "사용감", sub: "데이터 기반 테스트" },
      { title: "보관", sub: "권장 사용 기간" },
    ],
    painEyebrow: "스킨케어 고민",
    painTitle: "피부에 닿는 순간이 달라집니다",
    recommendTitle: "이런 피부·라이프스타일에 맞아요",
    noticeTitle: "사용 전 확인",
    compareColOurs: "이 제품",
    compareColTypical: "흔한 대안",
    quoteAuthorLabel: "뷰티 유저",
    compositionDefault: ["본품", "사용 설명", "정품 박스"],
  },
  fashion: {
    trustStrip: [
      { title: "소재", sub: "촉감·내구성" },
      { title: "핏", sub: "체형 고려 디자인" },
      { title: "케어", sub: "세탁 가이드" },
    ],
    painEyebrow: "스타일 고민",
    painTitle: "옷장에 남는 한 벌이 되려면",
    recommendTitle: "이런 분께 잘 맞아요",
    noticeTitle: "구매 전 체크",
    compareColOurs: "이 아이템",
    compareColTypical: "유사 가격대",
    quoteAuthorLabel: "스타일 고객",
    compositionDefault: ["의류 본품", "택·라벨", "배송 패키지"],
  },
  pet: {
    trustStrip: [
      { title: "성분", sub: "반려동물 안전" },
      { title: "급여", sub: "간편한 루틴" },
      { title: "보관", sub: "신선도 유지" },
    ],
    painEyebrow: "반려동물 케어",
    painTitle: "매일 먹이는 것, 더 신중하게",
    recommendTitle: "이런 아이·보호자께",
    noticeTitle: "급여 전 확인",
    compareColOurs: "이 제품",
    compareColTypical: "일반 간식",
    quoteAuthorLabel: "보호자 후기",
    compositionDefault: ["본품", "급여 가이드", "밀봉 포장"],
  },
  tech: {
    trustStrip: [
      { title: "호환", sub: "환경 맞춤" },
      { title: "내구", sub: "일상 사용 기준" },
      { title: "지원", sub: "A/S 안내" },
    ],
    painEyebrow: "기기 선택",
    painTitle: "작업·게임 환경이 달라지는 이유",
    recommendTitle: "이런 사용 환경에 추천",
    noticeTitle: "구매 전 꼭 확인",
    compareColOurs: "이 모델",
    compareColTypical: "동급 제품",
    quoteAuthorLabel: "실사용자",
    compositionDefault: ["본체", "케이블·구성품", "빠른 시작 가이드"],
  },
  home: {
    trustStrip: [
      { title: "소재", sub: "마감 품질" },
      { title: "공간", sub: "배치 가이드" },
      { title: "배송", sub: "안전 포장" },
    ],
    painEyebrow: "공간 연출",
    painTitle: "집 안 분위기를 바꾸는 디테일",
    recommendTitle: "이런 공간에 어울려요",
    noticeTitle: "배송·조립 안내",
    compareColOurs: "이 상품",
    compareColTypical: "유사 라인",
    quoteAuthorLabel: "구매 고객",
    compositionDefault: ["본품", "부속품", "설명서"],
  },
  kids: {
    trustStrip: [
      { title: "안전", sub: "연령 기준" },
      { title: "교육", sub: "발달 단계" },
      { title: "포장", sub: "선물용 구성" },
    ],
    painEyebrow: "육아 선택",
    painTitle: "아이에게 더 나은 선택을 하려면",
    recommendTitle: "이런 가정에 추천",
    noticeTitle: "사용 전 확인",
    compareColOurs: "이 제품",
    compareColTypical: "일반 제품",
    quoteAuthorLabel: "보호자",
    compositionDefault: ["본품", "안전 안내", "포장재"],
  },
  general: {
    trustStrip: [
      { title: "품질", sub: "검수 기준" },
      { title: "배송", sub: "안전 포장" },
      { title: "문의", sub: "빠른 응대" },
    ],
    painEyebrow: "구매 고민",
    painTitle: "왜 이 제품이 필요한가요?",
    recommendTitle: "이런 분께 추천합니다",
    noticeTitle: "구매 전 꼭 확인하세요",
    compareColOurs: "이 상품",
    compareColTypical: "일반 선택",
    quoteAuthorLabel: "구매 고객",
    compositionDefault: ["본품", "구성품", "안내서"],
  },
};

export function voiceFor(cat: VisualCategoryKey): CategoryVoice {
  return VOICES[cat] ?? VOICES.general;
}
