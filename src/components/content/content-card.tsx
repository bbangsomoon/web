import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/common/ui";
import { MediaPreview } from "@/components/content/media-preview";
import { formatDate } from "@/lib/utils";
import type { Content } from "@/types";

export function ContentCard({ content, compact = false }: { content: Content; compact?: boolean }) {
  const href = `/contents/${content.id}`;
  return <Link href={href} className="focus-ring group flex gap-4 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-orange-200 hover:shadow-lg hover:shadow-orange-950/5">
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-stone-100 ${compact ? "size-20" : "h-24 w-24 sm:w-32"}`}><MediaPreview asset={content.assets[0]} sizes="128px" className="object-cover"/></div>
    <div className="min-w-0 flex-1 py-1"><div className="flex items-center gap-2"><Badge status={content.status}/>{content.status === "scheduled" && content.scheduledAt && <span className="hidden items-center gap-1 text-xs text-stone-400 sm:flex"><CalendarClock className="size-3.5"/>{formatDate(content.scheduledAt,true)}</span>}</div><p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-stone-700">{content.body}</p></div><ChevronRight className="my-auto size-5 shrink-0 text-stone-300 transition group-hover:translate-x-1 group-hover:text-[#ef6b32]"/>
  </Link>;
}
