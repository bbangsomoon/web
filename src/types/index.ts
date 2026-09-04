export type ContentStatus = "draft" | "scheduled" | "published" | "failed";
export type ContentTone = "friendly" | "lively" | "witty" | "premium";
export type ContentPurpose = "new_product" | "today_bread" | "promotion" | "event";
export type ContentFormat = "feed" | "reel";

export interface User { id: string; name: string; phone: string; email: string; storeName: string; }
export interface AuthSession { user: User; accessToken: string; }
export interface LoginRequest { email: string; password: string; }
export interface SignupRequest { name: string; phone: string; email: string; password: string; }
export interface FirstStoreRequest {
  name: string; postalCode: string; address: string; addressDetail: string; phone: string;
  businessRegistrationNumber: string; representativeName: string;
}

export interface Store {
  id: string; name: string; description: string; postalCode: string; address: string; addressDetail: string; phone: string;
  representativeName: string; businessRegistrationNumber: string;
  weeklyHours: StoreBusinessHour[];
  businessHours: string; temporaryClosureStart: string; temporaryClosureEnd: string;
  temporaryClosureReason: string; amenities: StoreAmenity[]; menus: StoreMenu[];
  defaultTone: ContentTone; blockedPhrases: string[];
}
export type StoreWeekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export interface StoreBusinessHour { day: StoreWeekday; open: boolean; openTime: string; closeTime: string; }
export type StoreAmenity = "parking" | "takeout" | "reservation" | "delivery" | "petFriendly" | "wifi";
export interface StoreMenu {
  id: string; category: string; name: string; price: number; description: string; imageUrl: string; soldOut: boolean;
}
export interface Product { id: string; name: string; price: number; description: string; imageUrl: string; }
export interface ContentAsset { id: string; type: "image" | "video"; url: string; alt: string; }
export interface SocialAccount { id: string; platform: "instagram"; handle: string; displayName: string; connected: boolean; }
export interface PublishSchedule { id: string; contentId: string; mode: "now" | "scheduled"; scheduledAt?: string; publishedAt?: string; }
export interface PostInsight { views: number; likes: number; saves: number; comments: number; }
export interface Content {
  id: string; title: string; breadName: string; price?: number; quantity?: string;
  highlights?: string; promotion?: string; additionalRequest?: string; body: string; hashtags: string[];
  tone: ContentTone; purpose: ContentPurpose; format: ContentFormat; status: ContentStatus; assets: ContentAsset[];
  createdAt: string; updatedAt: string; scheduledAt?: string; publishedAt?: string; failedAt?: string; insight?: PostInsight;
}
export interface ContentGenerationRequest {
  prompt: string;
  media: Array<{ type: ContentAsset["type"]; url: string }>;
}
