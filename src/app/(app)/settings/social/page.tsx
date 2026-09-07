"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, LoaderCircle, ShieldCheck, Unlink } from "lucide-react";
import { Button, ConfirmDialog, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { InstagramIcon } from "@/components/common/brand-icons";
import { useToast } from "@/components/common/providers";
import { useSelectedStore } from "@/lib/active-store";
import { contentApi } from "@/lib/api/content-api";

function SocialSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const toast = useToast();
  const { storeId, stores } = useSelectedStore();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const { data, isLoading, isError } = useQuery({ queryKey: ["social", storeId], queryFn: () => contentApi.getInstagramAccount(storeId), enabled: Boolean(storeId) });

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status || !storeId) return;
    if (status === "connected") {
      client.invalidateQueries({ queryKey: ["social", storeId] });
      toast("인스타그램 계정을 연결했어요.");
    } else if (status === "failed") {
      toast("인스타그램 계정을 연결하지 못했어요. 다시 시도해 주세요.", "error");
    }
    router.replace("/settings/social");
  }, [client, router, searchParams, storeId, toast]);

  const connect = useMutation({
    mutationFn: () => contentApi.getInstagramAuthorizeUrl(storeId),
    onSuccess: ({ authorizeUrl }) => { window.location.assign(authorizeUrl); },
  });
  const disconnect = useMutation({
    mutationFn: () => contentApi.disconnectInstagram(storeId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["social", storeId] });
      setConfirmDisconnect(false);
      toast("인스타그램 연결을 해제했어요.", "info");
    },
  });

  if (stores.isLoading || isLoading) return <LoadingState />;
  if (stores.isError || isError || !data || !storeId) return <ErrorState />;

  return <div className="mx-auto max-w-3xl">
    <PageHeader title="SNS 관리" />
    <div>
      <section className="surface overflow-hidden rounded-[28px]">
        <div className="flex items-center gap-3 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-6 py-5 text-white"><InstagramIcon className="size-8" /><h2 className="text-xl font-black">Instagram</h2></div>
        <div className="p-5 sm:p-7">
          {data.connected ? <div className="flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-stone-900 text-white">{data.profilePictureUrl ? <Image src={data.profilePictureUrl} alt="" width={56} height={56} unoptimized className="size-full object-cover" /> : <InstagramIcon className="size-6" />}</div><div className="min-w-0"><div className="flex items-center gap-2"><b className="truncate text-lg">@{data.username}</b><CheckCircle2 className="size-4 shrink-0 text-blue-500" /></div><p className="text-sm text-stone-500">{data.accountType === "CREATOR" ? "크리에이터 계정" : "비즈니스 계정"}</p></div><span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">연결됨</span></div> : <div className="py-1 text-center"><h3 className="font-black">연결된 SNS가 없어요</h3><p className="mt-1 text-sm text-stone-500">사용할 SNS를 연결해 게시를 시작하세요.</p></div>}
          <Button onClick={() => data.connected ? setConfirmDisconnect(true) : connect.mutate()} disabled={connect.isPending || disconnect.isPending} variant={data.connected ? "secondary" : "primary"} className="mt-5 w-full">{connect.isPending || disconnect.isPending ? <LoaderCircle className="size-4 animate-spin" /> : data.connected ? <Unlink className="size-4" /> : <InstagramIcon className="size-4" />}{data.connected ? "연결 해제" : "인스타그램 연결"}</Button>
        </div>
      </section>
      <section className="mt-5 rounded-[28px] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 font-black"><ShieldCheck className="size-5 text-emerald-600" />연결하면 무엇을 할 수 있나요?</h2><ul className="mt-5 space-y-4">{["연결한 SNS에 사진 콘텐츠를 게시하거나 예약할 수 있어요.", "게시 상태와 고객 반응을 한곳에서 확인할 수 있어요.", "계정 비밀번호는 빵소문에 저장되지 않아요."].map((text) => <li key={text} className="flex gap-3 text-sm leading-6 text-stone-600"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#ef6b32]" />{text}</li>)}</ul><div className="mt-6 rounded-2xl bg-stone-50 p-4 text-xs leading-5 text-stone-500">인스타그램 비즈니스 또는 크리에이터 계정이 필요해요. <span className="inline-flex items-center font-bold text-stone-700">도움말 <ExternalLink className="ml-1 size-3" /></span></div></section>
    </div>
    <ConfirmDialog open={confirmDisconnect} title="인스타그램 연결을 해제할까요?" description="이미 게시된 Instagram 콘텐츠는 그대로 남고, 예약된 콘텐츠도 삭제되지 않아요." confirmLabel="연결 해제" onClose={() => setConfirmDisconnect(false)} onConfirm={() => disconnect.mutate()} />
  </div>;
}

export default function SocialSettingsPage() {
  return <Suspense fallback={<LoadingState />}><SocialSettingsContent /></Suspense>;
}
