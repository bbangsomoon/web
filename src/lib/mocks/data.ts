import type { Content, Product, SocialAccount, Store } from "@/types";

const photo = "/images/bakery-hero.png";
const now = Date.now();
export const initialStore: Store = {
  id: "store-1", name: "소문빵집", description: "매일 아침 천천히 반죽하고 정성껏 굽는 동네 빵집입니다.",
  postalCode: "03983", address: "서울 마포구 성미산로24길 18", addressDetail: "1층", phone: "02-123-4567",
  representativeName: "김소문", businessRegistrationNumber: "123-45-67890",
  weeklyHours: [
    { day: "monday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "tuesday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "wednesday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "thursday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "friday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "saturday", open: false, openTime: "08:00", closeTime: "19:00" },
    { day: "sunday", open: false, openTime: "08:00", closeTime: "19:00" },
  ],
  businessHours: "브레이크 타임 13:00–14:00",
  temporaryClosureStart: "", temporaryClosureEnd: "", temporaryClosureReason: "",
  amenities: ["takeout", "reservation", "wifi"],
  menus: [
    { id: "p1", category: "페이스트리", name: "버터 크루아상", price: 3800, description: "프랑스산 버터의 깊고 고소한 향", imageUrl: photo, soldOut: false },
    { id: "p2", category: "하드 브레드", name: "무화과 깜빠뉴", price: 7800, description: "무화과와 호두가 듬뿍", imageUrl: photo, soldOut: false },
    { id: "p3", category: "식사빵", name: "소금빵", price: 3000, description: "겉은 바삭, 속은 촉촉", imageUrl: photo, soldOut: true },
    { id: "p4", category: "구움과자", name: "레몬 마들렌", price: 2800, description: "상큼한 레몬 향", imageUrl: photo, soldOut: false },
    { id: "p5", category: "식빵", name: "소문 식빵", price: 6500, description: "우유와 버터로 부드럽게", imageUrl: photo, soldOut: false },
  ],
  defaultTone: "friendly", blockedPhrases: ["무조건", "역대급", "최저가"],
};
export const initialStores: Store[] = [
  initialStore,
  {
    ...initialStore,
    id: "store-2",
    name: "소문빵집 망원점",
    postalCode: "04010",
    address: "서울 마포구 월드컵로13길 22",
    addressDetail: "1층",
    phone: "02-987-6543",
    menus: initialStore.menus.map((menu) => ({ ...menu, id: `store-2-${menu.id}` })),
  },
];
export const initialSocial: SocialAccount = { id: "social-1", platform: "instagram", handle: "@somoon_bakery", displayName: "소문빵집", connected: true };
export const initialProducts: Product[] = [
  { id: "p1", name: "버터 크루아상", price: 3800, description: "프랑스산 버터의 깊고 고소한 향", imageUrl: photo },
  { id: "p2", name: "무화과 깜빠뉴", price: 7800, description: "무화과와 호두가 듬뿍", imageUrl: photo },
  { id: "p3", name: "소금빵", price: 3000, description: "겉은 바삭, 속은 촉촉", imageUrl: photo },
  { id: "p4", name: "레몬 마들렌", price: 2800, description: "상큼한 레몬 향", imageUrl: photo },
  { id: "p5", name: "소문 식빵", price: 6500, description: "우유와 버터로 부드럽게", imageUrl: photo },
];

const texts = [
  "오늘도 고소한 버터 향으로 문을 열었습니다. 겹겹이 바삭한 크루아상, 오전 11시에 가장 맛있게 만나요.",
  "천천히 발효한 무화과 깜빠뉴가 나왔어요. 톡톡 씹히는 무화과와 고소한 호두를 아낌없이 넣었습니다.",
  "점심 전 따끈한 소금빵 한 판 더 나왔습니다. 겉은 바삭하고 속은 촉촉해요.",
  "레몬 향을 가득 품은 마들렌입니다. 커피 한 잔과 함께 산뜻한 오후를 즐겨 보세요.",
  "매일 먹어도 편안한 소문 식빵. 오늘 아침에도 부드럽고 담백하게 구웠습니다.",
  "비 오는 날엔 갓 구운 빵 냄새가 더 반갑지요. 오늘도 저녁 7시까지 기다릴게요.",
  "오늘 남은 빵을 오후 6시부터 작은 할인가로 준비합니다. 필요한 만큼만 구워 남김을 줄여요.",
  "이번 주말, 동네 손님들을 위한 시식 테이블을 열어요. 편하게 들러 맛보고 인사 나눠요.",
];
const statuses: Content["status"][] = ["published", "scheduled", "published", "draft", "failed", "draft", "scheduled", "published"];
export const initialContents: Content[] = texts.map<Content>((body, index) => {
  const createdAt = new Date(now - index * 86400000).toISOString();
  const status = statuses[index];
  return {
    id: String(index + 1), title: index === 0 ? "오늘의 버터 크루아상" : ["무화과 깜빠뉴", "갓 나온 소금빵", "레몬 마들렌", "소문 식빵", "비 오는 날의 빵", "마감 빵 알림", "주말 시식회"][index - 1],
    breadName: ["버터 크루아상", "무화과 깜빠뉴", "소금빵", "레몬 마들렌", "소문 식빵", "오늘의 빵", "마감 빵", "주말 시식회"][index],
    price: [3800,7800,3000,2800,6500,undefined,undefined,undefined][index], body,
    hashtags: ["소문빵집", "동네빵집", index % 2 ? "오늘의빵" : "갓구운빵"], tone: "friendly", purpose: index === 6 ? "promotion" : "today_bread", format: "feed",
    status, assets: [{ id: `asset-${index}`, type: "image", url: photo, alt: "따뜻한 햇살 아래 놓인 갓 구운 빵" }], createdAt, updatedAt: createdAt,
    scheduledAt: status === "scheduled" ? new Date(now + (index + 1) * 3600000).toISOString() : undefined,
    publishedAt: status === "published" ? createdAt : undefined,
    failedAt: status === "failed" ? createdAt : undefined,
    insight: status === "published" ? { views: 1240 - index * 83, likes: 118 - index * 8, saves: 34 - index * 2, comments: 12 - index } : undefined,
  };
}).filter((content) => content.id !== "4");
