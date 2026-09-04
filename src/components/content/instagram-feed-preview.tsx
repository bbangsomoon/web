"use client";

import Image from "next/image";
import { useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Ellipsis, Heart, MessageCircle, Send } from "lucide-react";
import { MediaPreview } from "@/components/content/media-preview";
import { cn } from "@/lib/utils";
import type { ContentAsset } from "@/types";

type InstagramFeedPreviewProps = {
  assets: ContentAsset[];
  body: string;
  hashtags: string[];
  handle: string;
  likes?: number;
  timeLabel?: string;
};

export function InstagramFeedPreview({ assets, body, hashtags, handle, likes = 0, timeLabel = "방금 전" }: InstagramFeedPreviewProps) {
  const [current, setCurrent] = useState(0);
  const username = handle.replace(/^@/, "");
  const asset = assets[current];

  const move = (direction: -1 | 1) => {
    setCurrent((index) => (index + direction + assets.length) % assets.length);
  };

  return <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white text-stone-950 shadow-[0_12px_32px_rgba(41,37,32,.08)]">
    <div className="flex items-center gap-3 px-3.5 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-[2px]">
        <div className="grid size-full place-items-center rounded-full bg-white p-0.5"><Image src="/icon.svg" alt="" width={28} height={28} className="size-full rounded-full" /></div>
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{username}</p></div>
      <Ellipsis className="size-5" aria-hidden="true" />
    </div>

    <div className="relative aspect-square bg-stone-100">
      <MediaPreview asset={asset} sizes="420px" controls={asset?.type === "video"} />
      {assets.length > 1 && <>
        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">{current + 1}/{assets.length}</span>
        <button type="button" onClick={() => move(-1)} aria-label="이전 미디어" className="focus-ring absolute left-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-stone-800 shadow"><ChevronLeft className="size-4" /></button>
        <button type="button" onClick={() => move(1)} aria-label="다음 미디어" className="focus-ring absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-stone-800 shadow"><ChevronRight className="size-4" /></button>
      </>}
    </div>

    <div className="px-3.5 pb-4 pt-3">
      <div className="relative flex items-center gap-3">
        <Heart className="size-6" aria-hidden="true" />
        <MessageCircle className="size-6" aria-hidden="true" />
        <Send className="size-6" aria-hidden="true" />
        {assets.length > 1 && <div className="absolute left-1/2 flex -translate-x-1/2 gap-1">{assets.map((item, index) => <span key={item.id || item.url} className={cn("size-1.5 rounded-full", index === current ? "bg-sky-500" : "bg-stone-300")} />)}</div>}
        <Bookmark className="ml-auto size-6" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs font-bold">좋아요 {likes.toLocaleString()}개</p>
      <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs leading-5"><b className="mr-1.5">{username}</b>{body}</p>
      {hashtags.length > 0 && <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-sky-900">{hashtags.map((tag) => `#${tag}`).join(" ")}</p>}
      <p className="mt-1.5 text-[10px] text-stone-400">{timeLabel}</p>
    </div>
  </div>;
}
