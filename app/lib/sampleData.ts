export type UnivType = "国立" | "公立" | "私立";

export type InterviewFailReport = {
  id: string;
  university: string;
  prefecture: string;
  region:
    | "北海道"
    | "東北"
    | "関東"
    | "中部"
    | "近畿"
    | "中国"
    | "四国"
    | "九州・沖縄";
  type: UnivType;
  title: string;
  summary: string;
  tags: string[];
};

export const sampleReports: InterviewFailReport[] = [
  {
    id: "r-001",
    university: "札幌医科大学",
    prefecture: "北海道",
    region: "北海道",
    type: "公立",
    title: "結論が薄く、深掘りに耐えなかった",
    summary:
      "志望理由が抽象的で、具体例→学び→将来像への接続が弱いと判断された感触。深掘りで一貫性が崩れた。",
    tags: ["志望理由", "一貫性", "深掘り"],
  },
  {
    id: "r-002",
    university: "東北大学",
    prefecture: "宮城県",
    region: "東北",
    type: "国立",
    title: "研究志向は良いが、患者視点が不足",
    summary:
      "研究の話は通った一方で、臨床・患者コミュニケーションの具体像が薄く評価が伸びなかった印象。",
    tags: ["研究", "患者視点", "臨床"],
  },
  {
    id: "r-003",
    university: "千葉大学",
    prefecture: "千葉県",
    region: "関東",
    type: "国立",
    title: "自己PRが実績列挙で終わった",
    summary:
      "実績の説明はできたが、課題→工夫→再現性の提示が弱く、人物像が伝わり切らなかった。",
    tags: ["自己PR", "再現性", "人物像"],
  },
  {
    id: "r-004",
    university: "慶應義塾大学",
    prefecture: "東京都",
    region: "関東",
    type: "私立",
    title: "志望理由が大学固有の話になっていない",
    summary:
      "『なぜ医学部か』は答えられても『なぜこの大学か』で弱い。カリキュラム・教育方針との接続が不足。",
    tags: ["大学別", "志望理由", "比較"],
  },
  {
    id: "r-005",
    university: "名古屋大学",
    prefecture: "愛知県",
    region: "中部",
    type: "国立",
    title: "倫理の問いでフレームがなく迷走",
    summary:
      "医療倫理のケースで、結論→理由→代替案→配慮の順に整理できず、思考の筋が見えにくかった。",
    tags: ["倫理", "ケース", "思考整理"],
  },
  {
    id: "r-006",
    university: "大阪大学",
    prefecture: "大阪府",
    region: "近畿",
    type: "国立",
    title: "反省点は語れるが、改善が抽象的",
    summary:
      "失敗経験の語りは良いが、改善策が『気をつける』止まり。行動レベルの変化が示せなかった。",
    tags: ["失敗経験", "改善", "行動"],
  },
  {
    id: "r-007",
    university: "岡山大学",
    prefecture: "岡山県",
    region: "中国",
    type: "国立",
    title: "地域医療の解像度が低い",
    summary:
      "地域医療を志す理由はあるが、現場の課題・多職種連携・継続ケアの具体像が浅かった。",
    tags: ["地域医療", "連携", "具体性"],
  },
  {
    id: "r-008",
    university: "久留米大学",
    prefecture: "福岡県",
    region: "九州・沖縄",
    type: "私立",
    title: "緊張で声量が落ち、伝達が弱い",
    summary:
      "内容は悪くないが、声量・間・目線が弱く、説得力が落ちた。対策は『型＋音読＋録画』が必要。",
    tags: ["話し方", "緊張", "表現"],
  },
];

export type PastQuestionCategory =
  | "志望理由"
  | "自己理解"
  | "医療倫理"
  | "時事・医療制度"
  | "コミュニケーション"
  | "地域医療";

export type PastQuestion = {
  id: string;
  category: PastQuestionCategory;
  question: string;
  hint: string;
};

export const samplePastQuestions: PastQuestion[] = [
  {
    id: "q-001",
    category: "志望理由",
    question: "なぜ医師になりたいのですか？",
    hint: "結論→原体験→学び→将来像、の順で一貫性を作る。",
  },
  {
    id: "q-002",
    category: "志望理由",
    question: "なぜ本学（この大学）なのですか？",
    hint: "教育方針・地域性・研究/臨床の特色を、あなたの動機と接続する。",
  },
  {
    id: "q-003",
    category: "自己理解",
    question: "あなたの長所・短所を教えてください。",
    hint: "短所は『対策済み/改善中』までをセットで。",
  },
  {
    id: "q-004",
    category: "自己理解",
    question: "失敗経験と、そこからの学びは？",
    hint: "原因→工夫→行動変化→結果、まで具体で。",
  },
  {
    id: "q-005",
    category: "医療倫理",
    question: "患者が治療を拒否したらどうしますか？",
    hint: "尊重・説明・代替案・安全確保・チーム連携の観点で整理。",
  },
  {
    id: "q-006",
    category: "医療倫理",
    question: "終末期医療で家族と本人の意向が違う場合は？",
    hint: "本人意思の確認、情報共有、倫理委員会/多職種、記録の重要性。",
  },
  {
    id: "q-007",
    category: "時事・医療制度",
    question: "最近気になった医療ニュースは？意見を教えてください。",
    hint: "事実→課題→影響（患者/現場）→あなたの提案、の順で。",
  },
  {
    id: "q-008",
    category: "コミュニケーション",
    question: "苦手な相手と協働した経験はありますか？",
    hint: "相手理解→合意形成→具体行動→結果、で語る。",
  },
  {
    id: "q-009",
    category: "地域医療",
    question: "地域偏在をどう考えますか？あなたはどう関わりますか？",
    hint: "制度・働き方・教育の観点＋自分の選択を具体化。",
  },
];

export type UniversityQuestionSet = {
  university: string;
  prefecture: string;
  region:
    | "北海道"
    | "東北"
    | "関東"
    | "中部"
    | "近畿"
    | "中国"
    | "四国"
    | "九州・沖縄";
  type: UnivType;
  questions: {
    id: string;
    question: string;
    notes?: string;
  }[];
};

export const sampleUniversityQuestions: UniversityQuestionSet[] = [
  {
    university: "東北大学",
    prefecture: "宮城県",
    region: "東北",
    type: "国立",
    questions: [
      {
        id: "u-tohoku-1",
        question: "なぜ本学を志望しましたか？（研究/臨床/地域性の観点で）",
        notes: "大学固有の資源→自分の動機→将来像、の接続が見られやすい。",
      },
      {
        id: "u-tohoku-2",
        question: "これまでに興味を持った研究テーマは？なぜ？",
      },
      {
        id: "u-tohoku-3",
        question: "チーム医療で意見が割れたら、あなたはどう動きますか？",
      },
    ],
  },
  {
    university: "千葉大学",
    prefecture: "千葉県",
    region: "関東",
    type: "国立",
    questions: [
      { id: "u-chiba-1", question: "医師として大切にしたい価値観は何ですか？" },
      {
        id: "u-chiba-2",
        question: "高校で力を入れたことを、学びまで含めて教えてください。",
      },
      {
        id: "u-chiba-3",
        question: "医療の情報発信（SNS等）をどう考えますか？",
      },
    ],
  },
  {
    university: "慶應義塾大学",
    prefecture: "東京都",
    region: "関東",
    type: "私立",
    questions: [
      {
        id: "u-keio-1",
        question: "本学で学びたいこと・活用したい環境は何ですか？",
      },
      {
        id: "u-keio-2",
        question: "あなたがリーダーシップを発揮した経験は？",
      },
      { id: "u-keio-3", question: "医療倫理のジレンマをどう整理しますか？" },
    ],
  },
  {
    university: "大阪大学",
    prefecture: "大阪府",
    region: "近畿",
    type: "国立",
    questions: [
      {
        id: "u-osaka-1",
        question: "あなたの弱みは何で、どう改善していますか？",
      },
      {
        id: "u-osaka-2",
        question: "失敗経験を一つ。再発防止の仕組みは？",
      },
      {
        id: "u-osaka-3",
        question: "医師の働き方改革をどう捉えますか？",
      },
    ],
  },
  {
    university: "久留米大学",
    prefecture: "福岡県",
    region: "九州・沖縄",
    type: "私立",
    questions: [
      {
        id: "u-kurume-1",
        question: "地域医療と専門医志向、どう両立したいですか？",
      },
      { id: "u-kurume-2", question: "ストレス時の対処法は？" },
      { id: "u-kurume-3", question: "患者対応で大切にしたいことは？" },
    ],
  },
];
