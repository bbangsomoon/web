"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, CalendarClock, Clapperboard, Eye, Heart, MessageCircle, Pencil, Save, Send, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { MediaPreview } from "@/components/content/media-preview";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";
import { formatDate } from "@/lib/utils";

export default function ContentDetailPage(){
  const {contentId:id}=useParams<{contentId:string}>(); const router=useRouter(); const client=useQueryClient(); const toast=useToast(); const [confirm,setConfirm]=useState<"delete"|"cancel"|null>(null);
  const {data,isLoading,isError}=useQuery({queryKey:["content",id],queryFn:()=>mockApi.getContent(id)});
  const remove=useMutation({mutationFn:()=>mockApi.deleteContent(id),onSuccess:()=>{client.invalidateQueries({queryKey:["contents"]});toast("콘텐츠를 삭제했어요.");router.replace("/contents")}});
  const cancel=useMutation({mutationFn:()=>mockApi.updateContent(id,{status:"generated",scheduledAt:undefined}),onSuccess:(next)=>{client.setQueryData(["content",id],next);client.invalidateQueries({queryKey:["contents"]});setConfirm(null);toast("예약을 취소했어요.", "info")}});
  if(isLoading)return <LoadingState/>; if(isError||!data)return <ErrorState message="콘텐츠를 찾을 수 없어요."/>;
  const time=data.scheduledAt||data.publishedAt||data.createdAt;
  return <div className="mx-auto max-w-5xl"><PageHeader title={data.title} description={`마지막 수정 ${formatDate(data.updatedAt,true)}`} backHref="/contents" action={<Badge status={data.status}/>}/><div className="grid gap-5 lg:grid-cols-[minmax(320px,.9fr)_1.1fr]">
    <div><div className="surface overflow-hidden rounded-[28px]"><div className={`relative bg-stone-100 ${data.format==="reel"?"aspect-[9/16] max-h-[720px]":"aspect-square"}`}><MediaPreview asset={data.assets[0]} sizes="520px" controls={data.format==="reel"}/>{data.format==="reel"&&<span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white"><Clapperboard className="size-3.5"/>릴스</span>}</div><div className="flex items-center gap-3 border-t border-stone-100 p-4 text-sm"><AtSign className="size-5 text-pink-600"/><div><b className="block">@somoon_bakery</b><span className="text-xs text-stone-400">Instagram · {data.format==="reel"?"Reels":"Feed"}</span></div></div></div>
      {data.status==="published"&&data.insight&&<div className="mt-5 grid grid-cols-4 gap-2">{[{icon:Eye,label:"조회",value:data.insight.views},{icon:Heart,label:"좋아요",value:data.insight.likes},{icon:Save,label:"저장",value:data.insight.saves},{icon:MessageCircle,label:"댓글",value:data.insight.comments}].map(({icon:Icon,label,value})=><div key={label} className="surface rounded-2xl p-3 text-center"><Icon className="mx-auto size-4 text-[#ef6b32]"/><strong className="mt-2 block text-lg">{value.toLocaleString()}</strong><span className="text-[11px] text-stone-400">{label}</span></div>)}</div>}
    </div>
    <article className="surface rounded-[28px] p-5 sm:p-8"><div className="flex items-center gap-2 text-sm font-bold text-stone-500"><CalendarClock className="size-4 text-[#ef6b32]"/>{data.status==="scheduled"?"예약 시간":data.status==="published"?"게시 시간":"작성 시간"}<span className="ml-auto text-stone-700">{formatDate(time,true)}</span></div><hr className="my-6 border-stone-100"/><p className="whitespace-pre-line text-[15px] leading-8 text-stone-700">{data.body}</p><div className="mt-6 flex flex-wrap gap-2">{data.hashtags.map(tag=><span key={tag} className="text-sm font-bold text-orange-600">#{tag}</span>)}</div>
      <div className="mt-8 grid gap-2 sm:grid-cols-2"><Link href={`/contents/${id}/edit`} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold hover:bg-stone-50"><Pencil className="size-4"/>수정하기</Link>{["draft","generated","failed"].includes(data.status)&&<Link href={`/contents/${id}/publish`} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ef6b32] px-4 text-sm font-bold text-white"><Send className="size-4"/>게시 설정</Link>}{data.status==="scheduled"&&<Button variant="secondary" onClick={()=>setConfirm("cancel")}><CalendarClock className="size-4"/>예약 취소</Button>}</div><button onClick={()=>setConfirm("delete")} className="focus-ring mx-auto mt-5 flex items-center gap-1 rounded-lg p-2 text-xs font-bold text-stone-400 hover:text-red-600"><Trash2 className="size-4"/>이 콘텐츠 삭제</button>
    </article>
  </div><ConfirmDialog open={confirm!==null} title={confirm==="delete"?"콘텐츠를 삭제할까요?":"예약 게시를 취소할까요?"} description={confirm==="delete"?"삭제한 콘텐츠는 되돌릴 수 없어요.":"콘텐츠는 삭제되지 않고 ‘생성 완료’ 상태로 돌아갑니다."} confirmLabel={confirm==="delete"?"삭제하기":"예약 취소"} onClose={()=>setConfirm(null)} onConfirm={()=>confirm==="delete"?remove.mutate():cancel.mutate()}/></div>;
}
