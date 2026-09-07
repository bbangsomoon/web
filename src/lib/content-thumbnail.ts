const thumbnailRequestedKey = (contentId: string) => `bbangsomoon.content-thumbnail-requested.${contentId}`;
const thumbnailTextKey = (contentId: string) => `bbangsomoon.content-thumbnail-text.${contentId}`;

export const markThumbnailRequested = (contentId: string) => {
  if (typeof window !== "undefined") localStorage.setItem(thumbnailRequestedKey(contentId), "true");
};

export const isThumbnailRequested = (contentId: string) => typeof window !== "undefined" && localStorage.getItem(thumbnailRequestedKey(contentId)) === "true";

export const getThumbnailText = (contentId: string) => typeof window === "undefined" ? "" : localStorage.getItem(thumbnailTextKey(contentId)) ?? "";

export const setThumbnailText = (contentId: string, text: string) => {
  if (typeof window !== "undefined") localStorage.setItem(thumbnailTextKey(contentId), text);
};
