"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, LoaderCircle, Plus, RefreshCw, X } from "lucide-react";
import { Button, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { MediaPreview } from "@/components/content/media-preview";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";
import type { Content } from "@/types";

function ContentEditor({ data }: { data: Content }) {
  const id=data.id; const router=useRouter(); const client=useQueryClient(); const toast=useToast();
  const [body,setBody]=useState(data.body); const [hashtags,setHashtags]=useState<string[]>(data.hashtags); const [tag,setTag]=useState("");
  const save=useMutation({mutationFn:()=>mockApi.updateContent(id,{body,hashtags}),onSuccess:(next)=>{client.setQueryData(["content",id],next);client.invalidateQueries({queryKey:["contents"]});toast("수정한 내용을 저장했어요.")}});
  const regenerate=useMutation({mutationFn:()=>mockApi.regenerateContent(id),onSuccess:(next)=>{setBody(next.body);client.setQueryData(["content",id],next);toast("새로운 문장으로 다시 만들었어요.", "info")}});
  const addTag=()=>{const next=tag.trim().replace(/^#/,"").replaceAll(" ","");if(next&&!hashtags.includes(next)){setHashtags(v=>[...v,next])}setTag("")};
  return <div className="mx-auto max-w-4xl"><PageHeader title="AI 콘텐츠 다듬기" description="사장님 말투에 맞게 자유롭게 고쳐 주세요." backHref={`/contents/${id}`}/><div className="grid gap-5 lg:grid-cols-[minmax(280px,.8fr)_1.2fr]">
    <aside><div className="surface sticky top-6 overflow-hidden rounded-[28px]"><div className={`relative bg-stone-100 ${data.format==="reel"?"aspect-[9/16]":"aspect-square"}`}><MediaPreview asset={data.assets[0]} sizes="400px" controls={data.format==="reel"}/></div><div className="p-5"><p className="text-xs font-bold text-stone-400">{data.format==="reel"?"릴스 영상":"선택한 사진"}</p><h2 className="mt-1 text-lg font-black">{data.breadName}</h2><p className="mt-2 text-sm text-stone-500">{data.price ? `${data.price.toLocaleString()}원` : "가격 정보 없음"}</p></div></div></aside>
    <section className="surface rounded-[28px] p-5 sm:p-7"><div className="mb-4 flex items-center justify-between"><div><span className="text-xs font-black text-[#ef6b32]">AI가 만든 초안</span><h2 className="mt-1 text-xl font-black">게시글 문구</h2></div><Button variant="secondary" onClick={()=>regenerate.mutate()} disabled={regenerate.isPending}>{regenerate.isPending?<LoaderCircle className="size-4 animate-spin"/>:<RefreshCw className="size-4"/>}<span className="hidden sm:inline">다시 생성</span></Button></div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} rows={12} className="field resize-none leading-7" aria-label="게시글 문구"/><div className="mt-2 text-right text-xs font-semibold text-stone-400">{body.length}자</div>
      <div className="mt-7"><h3 className="flex items-center gap-2 text-sm font-black"><Hash className="size-4 text-[#ef6b32]"/>해시태그</h3><div className="mt-3 flex flex-wrap gap-2">{hashtags.map(item=><span key={item} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-orange-50 pl-3 pr-2 text-sm font-bold text-orange-700">#{item}<button type="button" aria-label={`${item} 삭제`} onClick={()=>setHashtags(v=>v.filter(t=>t!==item))} className="grid size-6 place-items-center rounded-full hover:bg-orange-100"><X className="size-3.5"/></button></span>)}</div><div className="mt-3 flex gap-2"><input value={tag} onChange={e=>setTag(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTag()}}} className="field" placeholder="해시태그 추가"/><Button type="button" variant="secondary" onClick={addTag} aria-label="해시태그 추가"><Plus className="size-5"/></Button></div></div>
      <div className="mt-8 grid gap-2 sm:grid-cols-2"><Button variant="secondary" onClick={()=>save.mutate()} disabled={save.isPending}>저장하기</Button><Button onClick={async()=>{await save.mutateAsync();router.push(`/contents/${id}/publish`)}} disabled={save.isPending}>저장하고 게시 설정</Button></div>
    </section>
  </div></div>;
}

export default function EditContentPage() {
  const {contentId:id}=useParams<{contentId:string}>();
  const {data,isLoading,isError}=useQuery({queryKey:["content",id],queryFn:()=>mockApi.getContent(id)});
  if(isLoading)return <LoadingState label="AI 글을 불러오고 있어요"/>; if(isError||!data)return <ErrorState message="콘텐츠를 찾을 수 없어요."/>;
  return <ContentEditor data={data}/>;
}
