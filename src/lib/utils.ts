import type { ContentPurpose, ContentStatus, ContentTone } from "@/types";

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");
export const formatWon = (value?: number) => value ? `${value.toLocaleString("ko-KR")}원` : "가격 미입력";
export const formatDate = (value: string, withTime = false) => new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "short", day: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
}).format(new Date(value));
export const todayKorean = () => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

export const statusMeta: Record<ContentStatus, { label: string; className: string }> = {
  draft: { label: "작성 중", className: "bg-stone-100 text-stone-600" },
  generated: { label: "생성 완료", className: "bg-orange-50 text-orange-700" },
  scheduled: { label: "예약됨", className: "bg-blue-50 text-blue-700" },
  published: { label: "게시 완료", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "게시 실패", className: "bg-red-50 text-red-700" },
};
export const toneLabel: Record<ContentTone, string> = { friendly: "친근하게", lively: "활기차게", witty: "발랄하게", premium: "고급스럽게" };
export const purposeLabel: Record<ContentPurpose, string> = { new_product: "신메뉴 소개", today_bread: "오늘의 빵 소개", promotion: "할인·마감 판매", event: "행사 안내" };
