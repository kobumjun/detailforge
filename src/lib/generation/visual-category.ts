export type VisualCategoryKey =
  | "food"
  | "beauty"
  | "fashion"
  | "pet"
  | "tech"
  | "home"
  | "kids"
  | "general";

export interface VisualCategoryProfile {
  key: VisualCategoryKey;
  /** Short Korean label for internal / debugging */
  labelKo: string;
  /** Prepended to English image prompts */
  imagePromptPrefix: string;
}

type Rule = {
  match: string[];
  profile: VisualCategoryProfile;
};

const RULES: Rule[] = [
  {
    match: [
      "딸기",
      "과일",
      "채소",
      "식품",
      "간식",
      "음식",
      "먹거리",
      "베이커리",
      "디저트",
      "커피",
      "녹차",
      "밀크티",
      "주스",
      "육류",
      "고기",
      "닭",
      "소시지",
      "밀키트",
      "밀크",
      "치즈",
      "요거트",
      "건강식",
      "프로틴",
      "다이어트식",
      "food",
      "snack",
      "fruit",
      "strawberry",
      "organic",
    ],
    profile: {
      key: "food",
      labelKo: "식품·푸드",
      imagePromptPrefix:
        "Food and beverage product photography only: packaged goods, ingredients close-up, plated dish, or grocery-style hero. No landscapes.",
    },
  },
  {
    match: [
      "화장품",
      "스킨",
      "세럼",
      "크림",
      "로션",
      "마스크팩",
      "클렌징",
      "향수",
      "메이크업",
      "립",
      "네일",
      "뷰티",
      "cosmetic",
      "serum",
      "skincare",
      "beauty",
    ],
    profile: {
      key: "beauty",
      labelKo: "뷰티",
      imagePromptPrefix:
        "Beauty and cosmetics product photography: bottles, jars, texture swatches, vanity flatlay. No outdoor nature scenes.",
    },
  },
  {
    match: [
      "옷",
      "의류",
      "패션",
      "셔츠",
      "반팔",
      "긴팔",
      "후드",
      "재킷",
      "바지",
      "청바지",
      "스커트",
      "원피스",
      "코트",
      "니트",
      "신발",
      "가방",
      "모자",
      "속옷",
      "apparel",
      "fashion",
      "shirt",
      "hoodie",
      "denim",
    ],
    profile: {
      key: "fashion",
      labelKo: "패션",
      imagePromptPrefix:
        "Apparel and accessories product photography: folded garment flatlay, hanger shot, or footwear on neutral set. No random scenery.",
    },
  },
  {
    match: [
      "강아지",
      "고양이",
      "반려",
      "펫",
      "애완",
      "펫푸드",
      "사료",
      "pet",
      "dog",
      "cat",
      "puppy",
    ],
    profile: {
      key: "pet",
      labelKo: "펫",
      imagePromptPrefix:
        "Pet care product photography: treats, toys, bowls, grooming items, or pet food packaging. Animals optional but on-theme only.",
    },
  },
  {
    match: [
      "전자",
      "디바이스",
      "스마트폰",
      "태블릿",
      "노트북",
      "pc",
      "모니터",
      "이어폰",
      "헤드폰",
      "충전",
      "가전",
      "기계",
      "gadget",
      "electronics",
      "laptop",
      "phone",
      "마우스",
      "키보드",
      "게이밍",
      "게임용",
      "gaming",
      "mouse",
      "keyboard",
      "headset",
      "웹캠",
      "스피커",
    ],
    profile: {
      key: "tech",
      labelKo: "테크",
      imagePromptPrefix:
        "Consumer electronics and PC peripherals only: mouse, keyboard, headset, monitor, or phone on desk; product detail shots. Never beauty salon, food, or unrelated props.",
    },
  },
  {
    match: [
      "가구",
      "인테리어",
      "조명",
      "침구",
      "소파",
      "테이블",
      "의자",
      "수납",
      "홈데코",
      "furniture",
      "interior",
      "home decor",
    ],
    profile: {
      key: "home",
      labelKo: "홈·리빙",
      imagePromptPrefix:
        "Home and living product photography: furniture vignette, decor object on table, lifestyle room corner matching the product.",
    },
  },
  {
    match: [
      "유아",
      "아기",
      "키즈",
      "출산",
      "육아",
      "장난감",
      "baby",
      "kids",
      "toddler",
    ],
    profile: {
      key: "kids",
      labelKo: "키즈",
      imagePromptPrefix:
        "Baby and kids product photography: safe product shots, nursery context, toys on clean surface. No unrelated outdoor vistas.",
    },
  },
];

const GENERAL: VisualCategoryProfile = {
  key: "general",
  labelKo: "일반",
  imagePromptPrefix:
    "Neutral ecommerce product still life matching the described merchandise. Studio or minimal lifestyle. Absolutely no unrelated nature landscape as subject.",
};

export function inferVisualCategory(input: {
  productDescription: string;
  targetCustomer?: string;
  sellingPoints?: string;
}): VisualCategoryProfile {
  const text = [
    input.productDescription,
    input.targetCustomer ?? "",
    input.sellingPoints ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of RULES) {
    for (const kw of rule.match) {
      const k = kw.toLowerCase();
      if (text.includes(k)) return rule.profile;
    }
  }
  return GENERAL;
}
