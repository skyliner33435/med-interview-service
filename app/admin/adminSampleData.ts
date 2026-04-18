export type AdminReport = {
  id: string;
  createdAt: string;
  university: string;
  year: string;
  interviewFormat: string;
  atmosphere: string;
  scoreDisclosure?: string;
  status: "pending" | "approved" | "rejected";
};

export type AdminUniversity = {
  id: string;
  name: string;
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
  type: "国立" | "公立" | "私立";
};

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  role: "admin" | "user";
};

export const seedReports: AdminReport[] = [
  {
    id: "rep_001",
    createdAt: "2026-04-10",
    university: "東北大学",
    year: "2026",
    interviewFormat: "個人面接",
    atmosphere: "和やか。深掘りは志望理由中心。",
    scoreDisclosure: "面接 18/20",
    status: "pending",
  },
  {
    id: "rep_002",
    createdAt: "2026-04-12",
    university: "慶應義塾大学",
    year: "2026",
    interviewFormat: "MMI",
    atmosphere: "テンポ早め。結論→根拠の型が重要。",
    status: "pending",
  },
  {
    id: "rep_003",
    createdAt: "2026-04-01",
    university: "大阪大学",
    year: "2026",
    interviewFormat: "個人面接",
    atmosphere: "標準。倫理/時事の確認あり。",
    status: "approved",
  },
];

export const seedUniversities: AdminUniversity[] = [
  {
    id: "univ_001",
    name: "東北大学",
    prefecture: "宮城県",
    region: "東北",
    type: "国立",
  },
  {
    id: "univ_002",
    name: "千葉大学",
    prefecture: "千葉県",
    region: "関東",
    type: "国立",
  },
  {
    id: "univ_003",
    name: "慶應義塾大学",
    prefecture: "東京都",
    region: "関東",
    type: "私立",
  },
  {
    id: "univ_004",
    name: "大阪大学",
    prefecture: "大阪府",
    region: "近畿",
    type: "国立",
  },
];

export const seedUsers: AdminUser[] = [
  {
    id: "usr_admin",
    email: "admin@example.com",
    createdAt: "2026-03-01",
    role: "admin",
  },
  {
    id: "usr_001",
    email: "user1@example.com",
    createdAt: "2026-03-10",
    role: "user",
  },
  {
    id: "usr_002",
    email: "user2@example.com",
    createdAt: "2026-04-02",
    role: "user",
  },
];

