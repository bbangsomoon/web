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
export type StoreSummary = { id: string; name: string; address: string };
export type ManagedStore = Store & { version: number };

type StoreResponse = {
  storeId: number; name: string; phoneNumber: string; postalCode: string; address: string; addressDetail: string;
  latitude: number; longitude: number; businessRegistrationNumber: string; representativeName: string;
  description: string | null; defaultTone: "FRIENDLY" | "LIVELY" | "WITTY" | "PREMIUM";
  temporaryClosureStart: string | null; temporaryClosureEnd: string | null; temporaryClosureReason: string | null; businessHoursNotice: string | null;
  businessHours: Array<{ weekday: string; open: boolean; openTime?: string; closeTime?: string }>;
  amenities: string[]; blockedPhrases: string[];
};
type MenuResponse = { menuId: number; storeId: number; category?: string | null; name: string; price: number; description?: string | null; imageUrl?: string | null; soldOut: boolean };
type StoreManagementResponse = {
  storeId: number; version: number; name: string; description: string | null; phoneNumber: string;
  postalCode: string; address: string; addressDetail: string | null;
  representativeName: string; businessRegistrationNumber: string;
  businessHours: Array<{ weekday: string; open: boolean; openTime?: string | null; closeTime?: string | null }>;
  businessHoursNotice: string | null;
  temporaryClosure: { startDate: string | null; endDate: string | null; reason: string | null } | null;
  menus: MenuResponse[]; amenities: string[]; defaultTone?: "FRIENDLY" | "LIVELY" | "WITTY" | "PREMIUM"; blockedPhrases?: string[];
};

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
const toManagedStore = (store: StoreManagementResponse): ManagedStore => ({
  id: String(store.storeId), version: store.version, name: store.name, description: store.description ?? "", postalCode: store.postalCode,
  address: store.address, addressDetail: store.addressDetail ?? "", phone: store.phoneNumber,
  representativeName: store.representativeName, businessRegistrationNumber: store.businessRegistrationNumber,
  weeklyHours: store.businessHours.map((hours) => ({
    day: weekdayMap[hours.weekday as keyof typeof weekdayMap], open: hours.open,
    openTime: hours.openTime?.slice(0, 5) ?? "09:00", closeTime: hours.closeTime?.slice(0, 5) ?? "18:00",
  })).filter((hours) => Boolean(hours.day)),
  businessHours: store.businessHoursNotice ?? "",
  temporaryClosureStart: store.temporaryClosure?.startDate ?? "", temporaryClosureEnd: store.temporaryClosure?.endDate ?? "", temporaryClosureReason: store.temporaryClosure?.reason ?? "",
  amenities: store.amenities.map((item) => amenityMap[item as keyof typeof amenityMap]).filter(Boolean),
  menus: store.menus.map(toMenu), defaultTone: toneMap[store.defaultTone ?? "FRIENDLY"] ?? "friendly", blockedPhrases: store.blockedPhrases ?? [],
});
const toManagementMenuPayload = (menu: StoreMenu) => ({
  menuId: /^\d+$/.test(menu.id) ? Number(menu.id) : null,
  name: menu.name, price: menu.price, description: menu.description || "", imageUrl: menu.imageUrl || null,
});
const toManagementHourPayload = (hours: StoreBusinessHour) => ({
  weekday: apiWeekdayMap[hours.day], open: hours.open,
  openTime: hours.open ? hours.openTime : null, closeTime: hours.open ? hours.closeTime : null,
});

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
    const stores = await apiFetch<MemberStoreSummary[]>("/api/stores/me");
    return stores.map((store) => ({ id: String(store.storeId), name: store.name, address: store.address }));
  },
  async getStore(id: string): Promise<ManagedStore> {
    return toManagedStore(await apiFetch<StoreManagementResponse>(`/api/stores/${id}/management`));
  },
  async updateStore(next: ManagedStore) {
    const response = await apiFetch<StoreManagementResponse>(`/api/stores/${next.id}/management`, {
      method: "PUT",
      body: JSON.stringify({
        version: next.version, name: next.name, description: next.description || null, phoneNumber: next.phone,
        postalCode: next.postalCode, address: next.address, addressDetail: next.addressDetail || null,
        businessHours: next.weeklyHours.map(toManagementHourPayload), businessHoursNotice: next.businessHours || null,
        temporaryClosure: {
          startDate: next.temporaryClosureStart || null, endDate: next.temporaryClosureEnd || null, reason: next.temporaryClosureReason || null,
        },
        menus: next.menus.map(toManagementMenuPayload),
        amenities: next.amenities.map((amenity) => apiAmenityMap[amenity]),
      }),
    });
    return toManagedStore(response);
  },
};
