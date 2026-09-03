"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, Search } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { mockApi } from "@/lib/api/mock-api";
import { cn, statusMeta } from "@/lib/utils";
import type { ContentStatus } from "@/types";

const filters: Array<{value:"all"|ContentStatus;label:string}>=[{value:"all",label:"전체"},...Object.entries(statusMeta).map(([value,meta])=>({value:value as ContentStatus,label:meta.label}))];
export default function ContentsPage(){
  const {data,isLoading,isError}=useQuery({queryKey:["contents"],queryFn:mockApi.getContents}); const [filter,setFilter]=useState<"all"|ContentStatus>("all"); const [query,setQuery]=useState(""); const [sortOrder,setSortOrder]=useState<"newest"|"oldest">("newest");
  const visible=useMemo(()=>data?.filter(c=>(filter==="all"||c.status===filter)&&(`${c.body} ${c.hashtags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>(sortOrder==="newest"?-1:1)*(+new Date(a.createdAt)-+new Date(b.createdAt)))||[],[data,filter,query,sortOrder]);
  return <><PageHeader title="콘텐츠" action={<Link href="/contents/new" className="focus-ring hidden min-h-11 items-center gap-2 rounded-xl bg-[#ef6b32] px-4 text-sm font-black text-white sm:flex"><Plus className="size-4"/>새로 만들기<span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] tracking-wide">AI</span></Link>}/><div className="mx-auto max-w-4xl">
    <div className="mb-5 flex flex-col gap-3"><div className="flex gap-2"><label className="relative flex-1"><span className="sr-only">콘텐츠 검색</span><Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="field pl-11!" placeholder="게시글 내용 검색"/></label><label className="relative w-32 shrink-0"><span className="sr-only">정렬 방식</span><select value={sortOrder} onChange={e=>setSortOrder(e.target.value as "newest"|"oldest")} className="field appearance-none pr-9! text-sm font-semibold"><option value="newest">최신순</option><option value="oldest">오래된순</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"/></label></div><div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{filters.map(item=><button key={item.value} onClick={()=>setFilter(item.value)} className={cn("focus-ring min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition",filter===item.value?"bg-stone-900 text-white":"border border-stone-200 bg-white text-stone-500 hover:border-stone-300")}>{item.label}{data&&<span className="ml-1 opacity-60">{item.value==="all"?data.length:data.filter(c=>c.status===item.value).length}</span>}</button>)}</div></div>
    {isLoading?<LoadingState/>:isError?<ErrorState/>:visible.length===0?<EmptyState title="조건에 맞는 콘텐츠가 없어요" description="검색어 또는 상태 필터를 바꿔 보세요."/>:<div className="grid gap-3 lg:grid-cols-2">{visible.map(c=><ContentCard key={c.id} content={c}/>)}</div>}
  </div></>;
}
