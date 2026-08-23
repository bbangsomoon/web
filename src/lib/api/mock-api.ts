import { initialContents, initialProducts, initialSocial, initialStore, initialStores } from "@/lib/mocks/data";
import type { AuthSession, Content, ContentGenerationRequest, FirstStoreRequest, LoginRequest, Product, SignupRequest, SocialAccount, Store } from "@/types";

const KEYS = { contents: "bbangsomoon.contents", stores: "bbangsomoon.stores", legacyStore: "bbangsomoon.store", activeStore: "bbangsomoon.active-store", social: "bbangsomoon.social", hoursDefaultClosed: "bbangsomoon.hours-default-closed-v1" } as const;
const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));
const read = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(fallback)); return fallback; }
  try { return JSON.parse(stored) as T; } catch { return fallback; }
};
const write = <T>(key: string, value: T) => { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value)); return value; };
const normalizeStore = (store: Partial<Store>): Store => ({
  ...initialStore,
  ...store,
  amenities: store.amenities ?? initialStore.amenities,
  menus: store.menus ?? initialStore.menus,
  weeklyHours: store.weeklyHours ?? initialStore.weeklyHours,
});
const readStores = (): Store[] => {
  if (typeof window === "undefined") return initialStores;
  const stored = localStorage.getItem(KEYS.stores);
  if (stored) {
    try {
      const stores = (JSON.parse(stored) as Partial<Store>[]).map(normalizeStore);
      if (!localStorage.getItem(KEYS.hoursDefaultClosed)) {
        const migrated = stores.map((store) => ({
          ...store,
          weeklyHours: store.weeklyHours.map((hours) => ({ ...hours, open: false })),
        }));
        write(KEYS.stores, migrated);
        localStorage.setItem(KEYS.hoursDefaultClosed, "true");
        return migrated;
      }
      return stores;
    } catch {}
  }
  const legacy = localStorage.getItem(KEYS.legacyStore);
  let primary = initialStore;
  if (legacy) {
    try { primary = normalizeStore(JSON.parse(legacy) as Partial<Store>); } catch {}
  }
  const stores = [primary, ...initialStores.filter((store) => store.id !== primary.id)].map((store) => ({
    ...store,
    weeklyHours: store.weeklyHours.map((hours) => ({ ...hours, open: false })),
  }));
  localStorage.setItem(KEYS.hoursDefaultClosed, "true");
  return write(KEYS.stores, stores);
};

export const mockApi = {
  async getSession(): Promise<AuthSession | null> {
    await wait(120);
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("bbangsomoon.session");
    if (!stored) return null;
    try { return JSON.parse(stored) as AuthSession; } catch { return null; }
  },
  async login(request: LoginRequest): Promise<AuthSession> {
    await wait(700);
    const session: AuthSession = { user: { id: "user-1", name: "김소문", phone: "010-1234-5678", email: request.email, storeName: "소문빵집" }, accessToken: "mock-access-token" };
    if (typeof window !== "undefined") localStorage.setItem("bbangsomoon.session", JSON.stringify(session));
    return session;
  },
  async signup(request: SignupRequest): Promise<AuthSession> {
    await wait(900);
    const session: AuthSession = { user: { id: String(Date.now()), name: request.name, phone: request.phone, email: request.email, storeName: "" }, accessToken: "mock-access-token" };
    if (typeof window !== "undefined") localStorage.setItem("bbangsomoon.session", JSON.stringify(session));
    return session;
  },
  async logout(): Promise<void> {
    await wait(350);
    if (typeof window !== "undefined") localStorage.removeItem("bbangsomoon.session");
  },
  async withdrawAccount(): Promise<void> {
    await wait(800);
    if (typeof window !== "undefined") Object.keys(localStorage).filter((key) => key.startsWith("bbangsomoon.")).forEach((key) => localStorage.removeItem(key));
  },
  async getContents(): Promise<Content[]> { await wait(); return read(KEYS.contents, initialContents).sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)); },
  async getContent(id: string): Promise<Content> { await wait(260); const found = read(KEYS.contents, initialContents).find((c) => c.id === id); if (!found) throw new Error("콘텐츠를 찾을 수 없어요."); return found; },
  async createContent(request: ContentGenerationRequest): Promise<Content> {
    await wait(1500); const all = read(KEYS.contents, initialContents); const id = String(Date.now());
    const content: Content = { id, title: `오늘의 ${request.breadName}`, ...request,
      body: `오늘 ${request.breadName}이(가) 맛있게 구워졌어요. ${request.highlights || "정성껏 반죽해 고소하고 편안한 맛을 담았습니다."}\n\n${request.promotion || "동네 산책길에 편하게 들러 주세요."}`,
      hashtags: ["소문빵집", "동네빵집", request.breadName.replaceAll(" ", ""), "오늘의빵"], status: "generated",
      assets: request.media.map((asset,i) => ({ id: `asset-${id}-${i}`, type: asset.type, url: asset.url, alt: request.breadName })), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    write(KEYS.contents, [content, ...all]); return content;
  },
  async updateContent(id: string, patch: Partial<Content>): Promise<Content> { await wait(); const all = read(KEYS.contents, initialContents); const current = all.find((c) => c.id === id); if (!current) throw new Error("콘텐츠를 찾을 수 없어요."); const next = { ...current, ...patch, updatedAt: new Date().toISOString() }; write(KEYS.contents, all.map((c) => c.id === id ? next : c)); return next; },
  async deleteContent(id: string): Promise<void> { await wait(); write(KEYS.contents, read(KEYS.contents, initialContents).filter((c) => c.id !== id)); },
  async regenerateContent(id: string): Promise<Content> { const item = await this.getContent(id); const variations = [`고소한 향이 골목까지 퍼지는 오늘의 ${item.breadName}. 한입 베어 물면 바삭한 결 사이로 부드러운 속살이 느껴져요. 갓 구운 지금, 소문빵집에서 만나요.`, `오늘의 작은 기쁨을 구웠습니다. 정성껏 만든 ${item.breadName}, 따뜻할 때 가장 맛있어요. 산책하듯 가볍게 들러 주세요.`]; return this.updateContent(id, { body: variations[Math.floor(Math.random()*variations.length)] }); },
  async publishContent(id: string, mode: "now" | "scheduled", scheduledAt?: string): Promise<Content> { await wait(700); return this.updateContent(id, mode === "now" ? { status: "published", publishedAt: new Date().toISOString(), insight: { views: 0, likes: 0, saves: 0, comments: 0 } } : { status: "scheduled", scheduledAt }); },
  async getStore(): Promise<Store> {
    await wait(250);
    const stores = readStores();
    const activeId = typeof window === "undefined" ? stores[0]?.id : localStorage.getItem(KEYS.activeStore);
    return stores.find((store) => store.id === activeId) ?? stores[0] ?? initialStore;
  },
  async getStores(): Promise<Store[]> { await wait(180); return readStores(); },
  async createFirstStore(request: FirstStoreRequest): Promise<Store> {
    await wait(650);
    const store: Store = {
      ...initialStore,
      ...request,
      id: `store-${Date.now()}`,
      description: "",
      weeklyHours: initialStore.weeklyHours.map((hours) => ({ ...hours, open: false })),
      businessHours: "",
      temporaryClosureStart: "",
      temporaryClosureEnd: "",
      temporaryClosureReason: "",
      amenities: [],
      menus: [],
      blockedPhrases: [],
    };
    write(KEYS.stores, [store]);
    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.activeStore, store.id);
      localStorage.setItem(KEYS.hoursDefaultClosed, "true");
      const session = localStorage.getItem("bbangsomoon.session");
      if (session) {
        try {
          const current = JSON.parse(session) as AuthSession;
          localStorage.setItem("bbangsomoon.session", JSON.stringify({ ...current, user: { ...current.user, storeName: store.name } }));
        } catch {}
      }
    }
    return store;
  },
  async setActiveStore(id: string): Promise<Store> {
    await wait(180);
    const store = readStores().find((item) => item.id === id);
    if (!store) throw new Error("매장을 찾을 수 없어요.");
    if (typeof window !== "undefined") localStorage.setItem(KEYS.activeStore, id);
    return store;
  },
  async updateStore(store: Store): Promise<Store> {
    await wait(500);
    const stores = readStores();
    write(KEYS.stores, stores.map((item) => item.id === store.id ? store : item));
    if (typeof window !== "undefined") localStorage.setItem(KEYS.activeStore, store.id);
    return store;
  },
  async getSocial(): Promise<SocialAccount> { await wait(250); return read(KEYS.social, initialSocial); },
  async toggleSocial(): Promise<SocialAccount> { await wait(600); const current = read(KEYS.social, initialSocial); return write(KEYS.social, { ...current, connected: !current.connected }); },
  async getProducts(): Promise<Product[]> { await wait(250); return initialProducts; },
};
