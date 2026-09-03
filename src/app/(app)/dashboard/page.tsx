"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Plus, Sparkles } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { ErrorState, LoadingState } from "@/components/common/ui";
import { mockApi } from "@/lib/api/mock-api";
import { formatDate, todayKorean } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["contents"], queryFn: mockApi.getContents });
  if (isLoading) return <LoadingState/>; if (isError || !data) return <ErrorState/>;
  const scheduled = data.filter(c=>c.status==="scheduled");
  return <>
    <header className="mb-7"><p className="text-sm font-bold text-[#ef6b32]">{todayKorean()}</p><h1 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">안녕하세요, 소문빵집 사장님!</h1></header>

    <Link href="/contents/new" className="focus-ring group relative flex min-h-44 overflow-hidden rounded-[28px] bg-[#ef6b32] p-6 text-white shadow-[0_18px_40px_rgba(239,107,50,.2)] sm:min-h-48 sm:p-8"><div className="relative z-10 max-w-lg"><div className="mb-4 flex items-center gap-2 text-xs font-extrabold text-orange-100"><Sparkles className="size-4"/>AI가 1분 만에 도와드려요</div><h2 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">새 홍보 콘텐츠 만들기</h2><p className="mt-2 text-sm leading-6 text-orange-50">홍보하고 싶은 내용을 자유롭게 알려주세요.<br className="hidden sm:block"/>빵소문이 SNS 콘텐츠로 만들어드릴게요.</p><span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#d95320]">지금 만들기 <ArrowRight className="size-4 transition group-hover:translate-x-1"/></span></div><div className="absolute -bottom-14 -right-8 size-56 rounded-full border-[38px] border-white/10"/><Plus className="absolute right-7 top-7 size-12 text-white/20 sm:right-12 sm:top-12 sm:size-20"/></Link>

    {scheduled.length>0 && <section className="mt-8"><div className="mb-4"><h2 className="text-xl font-black">예약된 게시물</h2></div><div className="grid gap-3 sm:grid-cols-2">{scheduled.slice(0,2).map(c=><Link key={c.id} href={`/contents/${c.id}`} className="focus-ring flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><CalendarClock className="size-5"/></div><div className="min-w-0"><p className="line-clamp-1 text-sm font-bold text-stone-700">{c.body}</p><p className="mt-1 text-xs font-semibold text-blue-600">{c.scheduledAt && formatDate(c.scheduledAt,true)}</p></div><ArrowRight className="ml-auto size-4 text-blue-400"/></Link>)}</div></section>}

    <section className="mt-9"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">최근 콘텐츠</h2><Link href="/contents" className="focus-ring flex items-center gap-1 rounded-lg text-sm font-bold text-stone-500 hover:text-[#d95320]">전체 보기 <ArrowRight className="size-4"/></Link></div><div className="grid gap-3 lg:grid-cols-2">{data.slice(0,4).map(c=><ContentCard key={c.id} content={c} compact/>)}</div></section>
  </>;
}
