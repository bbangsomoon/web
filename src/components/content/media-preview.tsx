"use client";
import Image from "next/image";
import type { ContentAsset } from "@/types";

export function MediaPreview({ asset, sizes = "400px", priority = false, controls = false, className = "object-cover" }: { asset?: Pick<ContentAsset,"type"|"url"|"alt">; sizes?: string; priority?: boolean; controls?: boolean; className?: string }) {
  if (asset?.type === "video") return <video src={asset.url} controls={controls} muted={!controls} playsInline preload="metadata" className={`absolute inset-0 h-full w-full ${className}`}>동영상 재생을 지원하지 않는 브라우저입니다.</video>;
  return <Image src={asset?.url||"/images/bakery-hero.png"} alt={asset?.alt||"갓 구운 빵"} fill unoptimized={asset?.url.startsWith("blob:")} priority={priority} sizes={sizes} className={className}/>;
}
