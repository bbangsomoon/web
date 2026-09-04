import { initialContents, initialProducts, initialSocial, initialStore, initialStores } from "@/lib/mocks/data";
import type { AuthSession, Content, ContentGenerationRequest, FirstStoreRequest, LoginRequest, Product, SignupRequest, SocialAccount, Store } from "@/types";

const KEYS = { contents: "bbangsomoon.contents", contentSeedCleanup: "bbangsomoon.contents-seed-cleanup-v1", stores: "bbangsomoon.stores", legacyStore: "bbangsomoon.store", activeStore: "bbangsomoon.active-store", social: "bbangsomoon.social", hoursDefaultClosed: "bbangsomoon.hours-default-closed-v1" } as const;
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
const readContents = (): Content[] => {
  const contents = read<Array<Content | (Omit<Content, "status"> & { status: "generated" })>>(KEYS.contents, initialContents);
  const hasLegacyStatus = contents.some((content) => content.status === "generated");
  const normalized = contents.map((content) => content.status === "generated" ? { ...content, status: "draft" as const } : content);
  if (typeof window !== "undefined" && !localStorage.getItem(KEYS.contentSeedCleanup)) {
    const cleaned = normalized.filter((content) => content.id !== "4");
    localStorage.setItem(KEYS.contentSeedCleanup, "true");
    write(KEYS.contents, cleaned);
    return cleaned;
  }
  if (hasLegacyStatus) write(KEYS.contents, normalized);
  return normalized;
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
  async getContents(): Promise<Content[]> { await wait(); return readContents().sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)); },
  async getContent(id: string): Promise<Content> { await wait(260); const found = readContents().find((c) => c.id === id); if (!found) throw new Error("콘텐츠를 찾을 수 없어요."); return found; },
  async createContent(request: ContentGenerationRequest): Promise<Content> {
    await wait(1500); const all = readContents(); const id = String(Date.now());
    const title = request.prompt.split(/[.!?\n]/)[0]?.trim().slice(0, 36) || "새 매장 소식";
    const generatedBody = request.prompt.trim()
      ? `${request.prompt}\n\n매장의 분위기가 자연스럽게 전해지도록 홍보 문구를 만들었어요. 편하게 방문해 주세요.`
      : "오늘의 매장 소식을 전해요. 사진 속 따뜻한 분위기를 직접 만나 보세요.";
    const content: Content = { id, title, breadName: "매장 소식", additionalRequest: request.prompt, tone: "friendly", purpose: "event", format: "feed",
      body: generatedBody,
      hashtags: ["빵소문", "동네매장", "매장소식"], status: "draft",
      assets: request.media.map((asset,i) => ({ id: `asset-${id}-${i}`, type: asset.type, url: asset.url, alt: "홍보 콘텐츠 첨부 미디어" })), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    write(KEYS.contents, [content, ...all]); return content;
  },
  async updateContent(id: string, patch: Partial<Content>): Promise<Content> { await wait(); const all = readContents(); const current = all.find((c) => c.id === id); if (!current) throw new Error("콘텐츠를 찾을 수 없어요."); const next = { ...current, ...patch, updatedAt: new Date().toISOString() }; write(KEYS.contents, all.map((c) => c.id === id ? next : c)); return next; },
  async deleteContent(id: string): Promise<void> { await wait(); write(KEYS.contents, readContents().filter((c) => c.id !== id)); },
  async regenerateContent(id: string): Promise<Content> { const item = await this.getContent(id); const request = item.additionalRequest || "매장의 새로운 소식을 알려 주세요."; const variations = [`${request}\n\n전하고 싶은 내용이 자연스럽게 닿을 수 있도록 준비했어요. 소문빵집에서 자세히 만나 보세요.`, `오늘 전해 드릴 매장 소식이 있어요.\n\n${request}\n\n궁금한 점은 편하게 문의해 주세요.`]; return this.updateContent(id, { body: variations[Math.floor(Math.random()*variations.length)] }); },
  async publishContent(id: string, mode: "now" | "scheduled", scheduledAt?: string): Promise<Content> { await wait(700); return this.updateContent(id, mode === "now" ? { status: "published", publishedAt: new Date().toISOString(), scheduledAt: undefined, failedAt: undefined, insight: { views: 0, likes: 0, saves: 0, comments: 0 } } : { status: "scheduled", scheduledAt, publishedAt: undefined, failedAt: undefined }); },
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
