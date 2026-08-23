"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Link2, LoaderCircle, ShieldCheck, Unlink } from "lucide-react";
import { Button, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { InstagramIcon } from "@/components/common/brand-icons";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";

export default function SocialSettingsPage() {
  const client = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError } = useQuery({ queryKey: ["social"], queryFn: mockApi.getSocial });
  const toggle = useMutation({ mutationFn: mockApi.toggleSocial, onSuccess: (next) => { client.setQueryData(["social"], next); toast(next.connected ? "인스타그램 계정을 연결했어요." : "계정 연결을 해제했어요.", next.connected ? "success" : "info"); } });
  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  return <>
    <PageHeader title="SNS 관리" />
    <div className="mx-auto max-w-3xl">
    <section className="surface overflow-hidden rounded-[28px]">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-7 text-white sm:p-9"><InstagramIcon className="size-9" /><h2 className="mt-5 text-2xl font-black">Instagram</h2><p className="mt-2 text-sm text-white/80">사진과 빵 이야기를 동네 손님들에게 전해요.</p></div>
      <div className="p-5 sm:p-7">
        {data.connected ? <div className="flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-full bg-stone-900 text-xl text-white">소</div><div className="min-w-0"><div className="flex items-center gap-2"><b className="truncate text-lg">{data.handle}</b><CheckCircle2 className="size-4 shrink-0 text-blue-500" /></div><p className="text-sm text-stone-500">{data.displayName}</p></div><span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">연결됨</span></div> : <div className="py-3 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-stone-100"><Link2 className="size-6 text-stone-400" /></div><h3 className="mt-4 font-black">연결된 SNS가 없어요</h3><p className="mt-2 text-sm text-stone-500">사용할 SNS를 연결해 게시를 시작하세요.</p></div>}
        <Button onClick={() => toggle.mutate()} disabled={toggle.isPending} variant={data.connected ? "secondary" : "primary"} className="mt-7 w-full">{toggle.isPending ? <LoaderCircle className="size-4 animate-spin" /> : data.connected ? <Unlink className="size-4" /> : <InstagramIcon className="size-4" />}{data.connected ? "연결 해제" : "인스타그램 연결"}</Button>
      </div>
    </section>
    <section className="mt-5 rounded-[28px] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 font-black"><ShieldCheck className="size-5 text-emerald-600" />연결하면 무엇을 할 수 있나요?</h2><ul className="mt-5 space-y-4">{["연결한 SNS에 사진과 영상 콘텐츠를 게시하거나 예약할 수 있어요.", "여러 채널의 게시 상태와 고객 반응을 한곳에서 확인할 수 있어요.", "계정 비밀번호는 빵소문에 저장되지 않아요."].map((text) => <li key={text} className="flex gap-3 text-sm leading-6 text-stone-600"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#ef6b32]" />{text}</li>)}</ul><div className="mt-6 rounded-2xl bg-stone-50 p-4 text-xs leading-5 text-stone-500">SNS에 따라 비즈니스 또는 프로페셔널 계정 전환이 필요할 수 있어요. <span className="inline-flex items-center font-bold text-stone-700">도움말 <ExternalLink className="ml-1 size-3" /></span></div></section>
    <p className="mt-4 text-center text-xs text-stone-400">MVP에서는 실제 SNS 인증 대신 연결 상태만 체험할 수 있습니다.</p>
    </div>
  </>;
}
