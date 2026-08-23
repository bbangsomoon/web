"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, CalendarClock, Check, Zap } from "lucide-react";
import { Button, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { MediaPreview } from "@/components/content/media-preview";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";
import { cn } from "@/lib/utils";

const nextMorning = new Date();
nextMorning.setDate(nextMorning.getDate() + 1);
nextMorning.setHours(11, 0, 0, 0);
const DEFAULT_DATE = nextMorning.toISOString().slice(0, 10);
const TODAY = new Date().toISOString().slice(0, 10);

export default function PublishPage() {
  const {contentId:id}=useParams<{contentId:string}>(); const router=useRouter(); const client=useQueryClient(); const toast=useToast();
  const [mode,setMode]=useState<"now"|"scheduled">("now"); const [date,setDate]=useState(DEFAULT_DATE); const [time,setTime]=useState("11:00");
  const content=useQuery({queryKey:["content",id],queryFn:()=>mockApi.getContent(id)}); const social=useQuery({queryKey:["social"],queryFn:mockApi.getSocial});
  const publish=useMutation({mutationFn:()=>mockApi.publishContent(id,mode,mode==="scheduled"?new Date(`${date}T${time}`).toISOString():undefined),onSuccess:(next)=>{client.setQueryData(["content",id],next);client.invalidateQueries({queryKey:["contents"]});toast(mode==="now"?(content.data?.format==="reel"?"Instagram 릴스로 게시했어요!":"Instagram 피드에 게시했어요!"):"게시 시간을 예약했어요!");router.push(`/contents/${id}`)}});
  if(content.isLoading||social.isLoading)return <LoadingState/>; if(content.isError||social.isError||!content.data||!social.data)return <ErrorState/>;
  return <div className="mx-auto max-w-3xl"><PageHeader title="게시 설정" description="언제 인스타그램에 소문낼지 선택해 주세요." backHref={`/contents/${id}/edit`}/>
    <div className="surface overflow-hidden rounded-[28px]"><div className="grid sm:grid-cols-[150px_1fr]"><div className={`relative ${content.data.format==="reel"?"aspect-[9/16]":"aspect-video sm:aspect-square"}`}><MediaPreview asset={content.data.assets[0]} sizes="300px" controls={content.data.format==="reel"}/></div><div className="p-5"><span className="text-xs font-black text-stone-400">게시할 {content.data.format==="reel"?"릴스":"콘텐츠"}</span><h2 className="mt-1 text-lg font-black">{content.data.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">{content.data.body}</p></div></div></div>
    <section className="mt-5 rounded-[28px] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">연결된 계정</h2><div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-fuchsia-50 to-orange-50 p-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white"><AtSign className="size-6"/></div><div className="min-w-0"><p className="font-black">{social.data.handle}</p><p className="text-xs text-stone-500">Instagram · 연결됨</p></div><span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-700"><Check className="size-4"/>정상</span></div></section>
    <section className="mt-5 rounded-[28px] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">게시 시간</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={()=>setMode("now")} className={cn("focus-ring flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left",mode==="now"?"border-[#ef6b32] bg-orange-50":"border-stone-200 hover:border-stone-300")}><span className={cn("grid size-11 place-items-center rounded-xl",mode==="now"?"bg-[#ef6b32] text-white":"bg-stone-100 text-stone-500")}><Zap className="size-5"/></span><span><b className="block">지금 바로 게시</b><small className="mt-1 block text-stone-500">확인 후 곧바로 올려요</small></span></button><button onClick={()=>setMode("scheduled")} className={cn("focus-ring flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left",mode==="scheduled"?"border-[#ef6b32] bg-orange-50":"border-stone-200 hover:border-stone-300")}><span className={cn("grid size-11 place-items-center rounded-xl",mode==="scheduled"?"bg-[#ef6b32] text-white":"bg-stone-100 text-stone-500")}><CalendarClock className="size-5"/></span><span><b className="block">예약 게시</b><small className="mt-1 block text-stone-500">원하는 시간에 올려요</small></span></button></div>
      {mode==="scheduled"&&<div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50 p-4"><label><span className="mb-2 block text-xs font-bold text-stone-500">날짜</span><input type="date" min={TODAY} value={date} onChange={e=>setDate(e.target.value)} className="field"/></label><label><span className="mb-2 block text-xs font-bold text-stone-500">시간</span><input type="time" value={time} onChange={e=>setTime(e.target.value)} className="field"/></label></div>}
    </section><Button className="mt-5 w-full min-h-14 text-base" onClick={()=>publish.mutate()} disabled={publish.isPending}>{publish.isPending?"게시를 준비하고 있어요":mode==="now"?`인스타그램 ${content.data.format==="reel"?"릴스":"피드"}에 게시하기`:`${date} ${time}에 예약하기`}</Button><p className="mt-3 text-center text-xs leading-5 text-stone-400">MVP에서는 실제 인스타그램에 게시되지 않고 상태만 변경됩니다.</p>
  </div>;
}
