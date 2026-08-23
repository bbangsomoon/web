"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Heart, MessageCircle, Save, Sparkles, TrendingUp } from "lucide-react";
import { ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { mockApi } from "@/lib/api/mock-api";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["contents"], queryFn: mockApi.getContents });
  if (isLoading) return <><PageHeader title="성과" /><LoadingState /></>;
  if (isError || !data) return <><PageHeader title="성과" /><ErrorState /></>;
  const published = data.filter((content) => content.status === "published" && content.insight);
  const totals = published.reduce((total, content) => ({
    views: total.views + (content.insight?.views || 0),
    likes: total.likes + (content.insight?.likes || 0),
    saves: total.saves + (content.insight?.saves || 0),
    comments: total.comments + (content.insight?.comments || 0),
  }), { views: 0, likes: 0, saves: 0, comments: 0 });
  const max = Math.max(...published.map((content) => content.insight?.views || 0), 1);
  const metrics = [
    { label: "총 조회", value: totals.views, icon: Eye, color: "bg-emerald-50 text-emerald-600" },
    { label: "좋아요", value: totals.likes, icon: Heart, color: "bg-rose-50 text-rose-600" },
    { label: "저장", value: totals.saves, icon: Save, color: "bg-orange-50 text-orange-600" },
    { label: "댓글", value: totals.comments, icon: MessageCircle, color: "bg-blue-50 text-blue-600" },
  ];

  return <>
    <PageHeader title="성과" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="surface rounded-2xl p-5"><div className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-5" /></div><strong className="mt-4 block text-2xl font-black">{value.toLocaleString()}</strong><span className="text-xs font-bold text-stone-400">{label}</span></div>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <section className="surface rounded-[28px] p-5 sm:p-7"><div className="flex items-center justify-between"><div><span className="text-xs font-black text-stone-400">게시물별 조회</span><h2 className="mt-1 text-xl font-black">잘 퍼진 소문</h2></div><TrendingUp className="size-6 text-emerald-600" /></div><div className="mt-7 space-y-5">{published.map((content) => <div key={content.id}><div className="mb-2 flex justify-between gap-4 text-sm"><b className="truncate">{content.title}</b><span className="shrink-0 font-black">{content.insight?.views.toLocaleString()}회</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-[#ef6b32] to-[#f4aa65]" style={{ width: `${((content.insight?.views || 0) / max) * 100}%` }} /></div></div>)}</div></section>
      <aside className="rounded-[28px] bg-[#28241f] p-6 text-white"><Sparkles className="size-7 text-orange-300" /><h2 className="mt-5 text-xl font-black">이번 달 한마디</h2><p className="mt-3 text-sm leading-7 text-stone-300">메뉴 사진과 가격을 함께 소개한 게시물의 저장 반응이 좋아요. 다음 게시물에도 <b className="text-white">메뉴 정보를 구체적으로</b> 담아 보세요.</p><div className="mt-7 rounded-2xl bg-white/8 p-4"><span className="text-xs text-stone-400">가장 반응 좋은 콘텐츠</span><strong className="mt-1 block text-2xl">신메뉴 소개</strong></div></aside>
    </div>
  </>;
}
