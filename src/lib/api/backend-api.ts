import { apiFetch, getAccessToken, setAccessToken } from "@/lib/api/api-client";
import type { AuthSession, FirstStoreRequest, LoginRequest, SignupRequest, Store, StoreAmenity, StoreBusinessHour, StoreMenu, StoreWeekday } from "@/types";

const AUTH_EMAIL_KEY = "bbangsomoon.auth-email";

type TokenResponse = { accessToken: string; expiresIn: number };
export type MemberStoreSummary = { storeId: number; name: string; address: string };
export type Member = {
  name: string; phoneNumber: string; role: "OWNER" | "ADMIN";
  marketingAgreed: boolean; createdAt: string; stores: MemberStoreSummary[];
};
export type Account = { email: string; name: string; lastLoginAt: string; createdAt: string };
export type BusinessRegistrationAvailability = { available: boolean; status: "계속사업자" | "휴업자" | "폐업자" | "미등록"; reason?: "ALREADY_REGISTERED" | "NOT_ACTIVE" };

type StoreResponse = {
  storeId: number; name: string; phoneNumber: string; postalCode: string; address: string; addressDetail: string;
  latitude: number; longitude: number; businessRegistrationNumber: string; representativeName: string;
  description: string | null; defaultTone: "FRIENDLY" | "LIVELY" | "WITTY" | "PREMIUM";
  temporaryClosureStart: string | null; temporaryClosureEnd: string | null; temporaryClosureReason: string | null; businessHoursNotice: string | null;
  businessHours: Array<{ weekday: string; open: boolean; openTime?: string; closeTime?: string }>;
  amenities: string[]; blockedPhrases: string[];
};
type MenuResponse = { menuId: number; storeId: number; category?: string | null; name: string; price: number; description?: string | null; imageUrl?: string | null; soldOut: boolean };

const weekdayMap = { MONDAY: "monday", TUESDAY: "tuesday", WEDNESDAY: "wednesday", THURSDAY: "thursday", FRIDAY: "friday", SATURDAY: "saturday", SUNDAY: "sunday" } as const;
const amenityMap = { PARKING: "parking", TAKEOUT: "takeout", RESERVATION: "reservation", DELIVERY: "delivery", PET_FRIENDLY: "petFriendly", WIFI: "wifi" } as const;
const toneMap = { FRIENDLY: "friendly", LIVELY: "lively", WITTY: "witty", PREMIUM: "premium" } as const;
const apiWeekdayMap: Record<StoreWeekday, keyof typeof weekdayMap> = { monday: "MONDAY", tuesday: "TUESDAY", wednesday: "WEDNESDAY", thursday: "THURSDAY", friday: "FRIDAY", saturday: "SATURDAY", sunday: "SUNDAY" };
const apiAmenityMap: Record<StoreAmenity, keyof typeof amenityMap> = { parking: "PARKING", takeout: "TAKEOUT", reservation: "RESERVATION", delivery: "DELIVERY", petFriendly: "PET_FRIENDLY", wifi: "WIFI" };

const rememberEmail = (email: string) => {
  if (typeof window !== "undefined") localStorage.setItem(AUTH_EMAIL_KEY, email);
};
const forgetEmail = () => {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_EMAIL_KEY);
};
const readEmail = () => typeof window === "undefined" ? "" : localStorage.getItem(AUTH_EMAIL_KEY) ?? "";

const toSession = (member: Member, account?: Account): AuthSession => ({
  accessToken: getAccessToken() ?? "",
  user: {
    id: account?.email ?? readEmail(), name: member.name, phone: member.phoneNumber, email: account?.email ?? readEmail(),
    storeName: member.stores[0]?.name ?? "",
  },
});

const toMenu = (menu: MenuResponse) => ({ id: String(menu.menuId), category: menu.category ?? "", name: menu.name, price: menu.price, description: menu.description ?? "", imageUrl: menu.imageUrl ?? "", soldOut: menu.soldOut });
const toStore = (store: StoreResponse, menus: MenuResponse[] = []): Store => ({
  id: String(store.storeId), name: store.name, description: store.description ?? "", postalCode: store.postalCode,
  address: store.address, addressDetail: store.addressDetail ?? "", phone: store.phoneNumber,
  representativeName: store.representativeName, businessRegistrationNumber: store.businessRegistrationNumber,
  weeklyHours: store.businessHours.map((hours) => ({
    day: weekdayMap[hours.weekday as keyof typeof weekdayMap], open: hours.open,
    openTime: hours.openTime?.slice(0, 5) ?? "09:00", closeTime: hours.closeTime?.slice(0, 5) ?? "18:00",
  })).filter((hours) => Boolean(hours.day)),
  businessHours: store.businessHoursNotice ?? "", temporaryClosureStart: store.temporaryClosureStart ?? "", temporaryClosureEnd: store.temporaryClosureEnd ?? "",
  temporaryClosureReason: store.temporaryClosureReason ?? "",
  amenities: store.amenities.map((item) => amenityMap[item as keyof typeof amenityMap]).filter(Boolean),
  menus: menus.map(toMenu), defaultTone: toneMap[store.defaultTone] ?? "friendly", blockedPhrases: store.blockedPhrases ?? [],
});
const toMenuPayload = (menu: StoreMenu) => ({ category: menu.category || null, name: menu.name, price: menu.price, description: menu.description || null, imageUrl: menu.imageUrl || null });
const toBusinessHourPayload = (hours: StoreBusinessHour) => hours.open
  ? { weekday: apiWeekdayMap[hours.day], open: true, openTime: `${hours.openTime}:00`, closeTime: `${hours.closeTime}:00` }
  : { weekday: apiWeekdayMap[hours.day], open: false };

export const backendApi = {
  sendVerificationCode: (email: string) => apiFetch<void>("/auth/email/verification-code", { method: "POST", body: JSON.stringify({ email }), auth: false }),
  confirmVerificationCode: (email: string, code: string) => apiFetch<void>("/auth/email/verification-code/confirm", { method: "POST", body: JSON.stringify({ email, code }), auth: false }),
  async signup(request: SignupRequest, consent: { termsAgreedAt: string; privacyAgreedAt: string }) {
    const token = await apiFetch<TokenResponse>("/auth/signup", { method: "POST", body: JSON.stringify({ email: request.email, password: request.password, name: request.name }), auth: false });
    setAccessToken(token.accessToken);
    rememberEmail(request.email);
    const member = await apiFetch<Member>("/api/members", { method: "POST", body: JSON.stringify({ name: request.name, phoneNumber: request.phone, ...consent, marketingAgreedAt: null }) });
    return toSession(member);
  },
  async login(request: LoginRequest) {
    const token = await apiFetch<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(request), auth: false });
    setAccessToken(token.accessToken);
    rememberEmail(request.email);
    const member = await apiFetch<Member>("/api/members/me");
    return { session: toSession(member), member };
  },
  getAccount: () => apiFetch<Account>("/auth/me"),
  async getSession() {
    try {
      const [member, account] = await Promise.all([apiFetch<Member>("/api/members/me"), apiFetch<Account>("/auth/me")]);
      rememberEmail(account.email);
      return toSession(member, account);
    }
    catch { return null; }
  },
  getMember: () => apiFetch<Member>("/api/members/me"),
  async logout() {
    await apiFetch<void>("/auth/logout", { method: "POST", auth: false });
    setAccessToken(null); forgetEmail();
  },
  async withdrawAccount() {
    await apiFetch<void>("/auth/me", { method: "DELETE" });
    setAccessToken(null); forgetEmail();
  },
  async createFirstStore(request: FirstStoreRequest) {
    const response = await apiFetch<StoreResponse>("/api/stores", { method: "POST", body: JSON.stringify({
      name: request.name, phoneNumber: request.phone, postalCode: request.postalCode, address: request.address,
      addressDetail: request.addressDetail, businessRegistrationNumber: request.businessRegistrationNumber, representativeName: request.representativeName,
    }) });
    return toStore(response);
  },
  getBusinessRegistrationAvailability: (value: string) => apiFetch<BusinessRegistrationAvailability>(`/api/stores/business-registration-number/availability?value=${encodeURIComponent(value)}`),
  async getStores() {
    const stores = await apiFetch<StoreResponse[]>("/api/stores/me");
    return Promise.all(stores.map(async (store) => toStore(store, await apiFetch<MenuResponse[]>(`/api/stores/${store.storeId}/menus`))));
  },
  async getStore(id: string) {
    const store = await apiFetch<StoreResponse>(`/api/stores/${id}`);
    return toStore(store, await apiFetch<MenuResponse[]>(`/api/stores/${id}/menus`));
  },
  async updateStore(current: Store, next: Store) {
    const storeId = next.id;
    if (current.name !== next.name || current.phone !== next.phone || current.description !== next.description) await apiFetch(`/api/stores/${storeId}`, { method: "PATCH", body: JSON.stringify({ name: next.name, phoneNumber: next.phone, description: next.description }) });
    if (current.postalCode !== next.postalCode || current.address !== next.address || current.addressDetail !== next.addressDetail) await apiFetch(`/api/stores/${storeId}/location`, { method: "PATCH", body: JSON.stringify({ postalCode: next.postalCode, address: next.address, addressDetail: next.addressDetail }) });
    if (JSON.stringify(current.weeklyHours) !== JSON.stringify(next.weeklyHours) || current.businessHours !== next.businessHours) await apiFetch(`/api/stores/${storeId}/business-hours`, { method: "PUT", body: JSON.stringify({ businessHours: next.weeklyHours.map(toBusinessHourPayload), businessHoursNotice: next.businessHours || null }) });
    if (JSON.stringify(current.amenities) !== JSON.stringify(next.amenities)) await apiFetch(`/api/stores/${storeId}/amenities`, { method: "PUT", body: JSON.stringify({ amenities: next.amenities.map((amenity) => apiAmenityMap[amenity]) }) });
    const closureChanged = current.temporaryClosureStart !== next.temporaryClosureStart || current.temporaryClosureEnd !== next.temporaryClosureEnd || current.temporaryClosureReason !== next.temporaryClosureReason;
    if (closureChanged && next.temporaryClosureStart && next.temporaryClosureEnd) {
      await apiFetch(`/api/stores/${storeId}/temporary-closure`, { method: "PUT", body: JSON.stringify({ startDate: next.temporaryClosureStart, endDate: next.temporaryClosureEnd, reason: next.temporaryClosureReason || null }) });
    } else if (closureChanged && (current.temporaryClosureStart || current.temporaryClosureEnd)) {
      await apiFetch(`/api/stores/${storeId}/temporary-closure`, { method: "DELETE" });
    }
    const currentMenus = new Map(current.menus.map((menu) => [menu.id, menu]));
    const nextMenus = new Map(next.menus.map((menu) => [menu.id, menu]));
    await Promise.all(current.menus.filter((menu) => !nextMenus.has(menu.id)).map((menu) => apiFetch<void>(`/api/stores/${storeId}/menus/${menu.id}`, { method: "DELETE" })));
    for (const menu of next.menus) {
      const previous = currentMenus.get(menu.id);
      if (!previous) {
        const created = await apiFetch<MenuResponse>(`/api/stores/${storeId}/menus`, { method: "POST", body: JSON.stringify(toMenuPayload(menu)) });
        if (menu.soldOut) await apiFetch(`/api/stores/${storeId}/menus/${created.menuId}/sold-out`, { method: "PATCH", body: JSON.stringify({ soldOut: true }) });
      } else {
        if (JSON.stringify(toMenuPayload(previous)) !== JSON.stringify(toMenuPayload(menu))) await apiFetch(`/api/stores/${storeId}/menus/${menu.id}`, { method: "PUT", body: JSON.stringify(toMenuPayload(menu)) });
        if (previous.soldOut !== menu.soldOut) await apiFetch(`/api/stores/${storeId}/menus/${menu.id}/sold-out`, { method: "PATCH", body: JSON.stringify({ soldOut: menu.soldOut }) });
      }
    }
    const store = await apiFetch<StoreResponse>(`/api/stores/${storeId}`);
    return toStore(store, await apiFetch<MenuResponse[]>(`/api/stores/${storeId}/menus`));
  },
};
