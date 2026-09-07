import { apiFetch } from "@/lib/api/api-client";
import type { Content, ContentAsset, ContentStatus } from "@/types";

type ApiContentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
export type ContentMedia = { type: "IMAGE"; url: string };
type ApiContent = {
  contentId: number;
  storeId: number;
  status: ApiContentStatus;
  caption: string;
  hashtags: string[];
  userPrompt: string | null;
  media: ContentMedia[];
  scheduledAt: string | null;
  publishedAt: string | null;
  failedAt: string | null;
  mediaId: string | null;
  permalink: string | null;
  failureCode: string | null;
  failureReason: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
type ContentListResponse = { items: ApiContent[]; page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean };
type UploadKeyResponse = { uploads: Array<{ key: string; uploadUrl: string; publicUrl: string }> };

export type InstagramAccount = {
  connected: boolean;
  username: string | null;
  accountType: "BUSINESS" | "CREATOR" | null;
  profilePictureUrl: string | null;
  tokenExpiresAt: string | null;
  tokenExpired: boolean;
};

const statusFromApi: Record<ApiContentStatus, ContentStatus> = {
  DRAFT: "draft", SCHEDULED: "scheduled", PUBLISHING: "publishing", PUBLISHED: "published", FAILED: "failed",
};
const statusToApi: Record<ContentStatus, ApiContentStatus> = {
  draft: "DRAFT", scheduled: "SCHEDULED", publishing: "PUBLISHING", published: "PUBLISHED", failed: "FAILED",
};

const toContent = (content: ApiContent): Content => {
  const createdAt = content.createdAt ?? content.updatedAt ?? content.publishedAt ?? content.scheduledAt ?? content.failedAt ?? new Date().toISOString();
  const assets: ContentAsset[] = content.media.map((media, index) => ({
    id: `${content.contentId}-${index}`,
    type: "image",
    url: media.url,
    alt: `첨부 사진 ${index + 1}`,
  }));
  return {
    id: String(content.contentId),
    title: content.caption.split(/\n|[.!?]/)[0]?.trim().slice(0, 36) || "새 콘텐츠",
    breadName: "",
    additionalRequest: content.userPrompt ?? "",
    body: content.caption,
    hashtags: content.hashtags,
    tone: "friendly",
    purpose: "event",
    format: "feed",
    status: statusFromApi[content.status],
    assets,
    createdAt,
    updatedAt: content.updatedAt ?? createdAt,
    scheduledAt: content.scheduledAt ?? undefined,
    publishedAt: content.publishedAt ?? undefined,
    failedAt: content.failedAt ?? undefined,
    permalink: content.permalink ?? undefined,
    failureCode: content.failureCode ?? undefined,
    failureReason: content.failureReason ?? undefined,
  };
};

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") search.set(key, String(value)); });
  return search.toString();
};

const contentPath = (contentId: string, storeId: string) => `/api/contents/${encodeURIComponent(contentId)}?${query({ storeId })}`;
const idempotencyKey = () => crypto.randomUUID();

export const contentApi = {
  async getContents(storeId: string, options: { status?: ContentStatus; keyword?: string; page?: number; size?: number } = {}) {
    const response = await apiFetch<ContentListResponse>(`/api/contents?${query({
      storeId,
      status: options.status ? statusToApi[options.status] : undefined,
      keyword: options.keyword,
      page: options.page ?? 0,
      size: options.size ?? 20,
    })}`);
    return { ...response, items: response.items.map(toContent) };
  },

  async getContent(storeId: string, contentId: string) {
    return toContent(await apiFetch<ApiContent>(contentPath(contentId, storeId)));
  },

  async uploadImages(files: File[]) {
    const response = await apiFetch<UploadKeyResponse>("/api/contents/upload-keys", {
      method: "POST",
      body: JSON.stringify({ count: files.length }),
    });
    if (response.uploads.length !== files.length) throw new Error("사진 업로드 주소를 모두 받지 못했어요. 다시 시도해 주세요.");
    await Promise.all(response.uploads.map(async ({ uploadUrl }, index) => {
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: files[index],
      });
      if (!upload.ok) throw new Error("사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }));
    return response.uploads.map(({ publicUrl }) => ({ type: "IMAGE" as const, url: publicUrl }));
  },

  async createCaption(storeId: string, media: ContentMedia[], userPrompt: string, key = idempotencyKey()) {
    return toContent(await apiFetch<ApiContent>("/api/contents/captions", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ storeId: Number(storeId), media, ...(userPrompt.trim() ? { userPrompt: userPrompt.trim() } : {}) }),
    }));
  },

  async regenerateCaption(storeId: string, contentId: string, userPrompt?: string, key = idempotencyKey()) {
    return toContent(await apiFetch<ApiContent>(`/api/contents/${encodeURIComponent(contentId)}/captions?${query({ storeId })}`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(userPrompt?.trim() ? { userPrompt: userPrompt.trim() } : {}),
    }));
  },

  async updateContent(storeId: string, contentId: string, patch: { caption?: string; hashtags?: string[] }) {
    return toContent(await apiFetch<ApiContent>(contentPath(contentId, storeId), {
      method: "PATCH",
      body: JSON.stringify(patch),
    }));
  },

  async deleteContent(storeId: string, contentId: string) {
    await apiFetch<void>(contentPath(contentId, storeId), { method: "DELETE" });
  },

  async cancelSchedule(storeId: string, contentId: string) {
    return toContent(await apiFetch<ApiContent>(`/api/contents/${encodeURIComponent(contentId)}/schedule?${query({ storeId })}`, { method: "DELETE" }));
  },

  async publish(storeId: string, contentId: string, scheduledAt: string | null, key = idempotencyKey()) {
    return toContent(await apiFetch<ApiContent>(`/api/contents/${encodeURIComponent(contentId)}/publish?${query({ storeId })}`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ scheduledAt }),
    }));
  },

  getInstagramAccount(storeId: string) {
    return apiFetch<InstagramAccount>(`/api/social/instagram/account?${query({ storeId })}`);
  },

  getInstagramAuthorizeUrl(storeId: string) {
    return apiFetch<{ authorizeUrl: string }>(`/api/social/instagram/oauth/authorize-url?${query({ storeId })}`);
  },

  async disconnectInstagram(storeId: string) {
    await apiFetch<void>(`/api/social/instagram/account?${query({ storeId })}`, { method: "DELETE" });
  },
};
