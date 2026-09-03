"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Eye, Heart, MessageCircle, Pencil, Save, Send, Trash2 } from "lucide-react";
import { Badge, Button, ConfirmDialog, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { InstagramFeedPreview } from "@/components/content/instagram-feed-preview";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";
import { formatDate } from "@/lib/utils";

export default function ContentDetailPage() {
  const { contentId: id } = useParams<{ contentId: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const toast = useToast();
  const [confirm, setConfirm] = useState<"delete" | "cancel" | null>(null);
  const content = useQuery({ queryKey: ["content", id], queryFn: () => mockApi.getContent(id) });
  const social = useQuery({ queryKey: ["social"], queryFn: mockApi.getSocial });

  const remove = useMutation({
    mutationFn: () => mockApi.deleteContent(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contents"] });
      toast("콘텐츠를 삭제했어요.");
      router.replace("/contents");
    },
  });

  const cancel = useMutation({
    mutationFn: () => mockApi.updateContent(id, { status: "draft", scheduledAt: undefined }),
    onSuccess: (next) => {
      client.setQueryData(["content", id], next);
      client.invalidateQueries({ queryKey: ["contents"] });
      setConfirm(null);
      toast("예약을 취소했어요.", "info");
    },
  });

  if (content.isLoading || social.isLoading) return <LoadingState />;
  if (content.isError || social.isError || !content.data || !social.data) return <ErrorState message="콘텐츠를 찾을 수 없어요." />;

  const data = content.data;
  const displayTime = data.status === "scheduled" ? data.scheduledAt || data.updatedAt : data.status === "published" ? data.publishedAt || data.updatedAt : data.updatedAt;
  const timeLabel = data.status === "scheduled" ? "예약 시간" : data.status === "published" ? "게시 시간" : "작성 시간";
  const canPublish = ["draft", "failed"].includes(data.status);

  return <div className="mx-auto max-w-5xl">
    <PageHeader title="콘텐츠 상세" backHref="/contents" action={<Badge status={data.status} />} />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,.9fr)_1.1fr]">
      <section>
        <h2 className="mb-3 text-sm font-bold">Instagram 피드</h2>
        <InstagramFeedPreview
          assets={data.assets}
          body={data.body}
          hashtags={data.hashtags}
          handle={social.data.handle}
          likes={data.insight?.likes}
          timeLabel={data.status === "published" ? formatDate(displayTime) : data.status === "scheduled" ? "예약 게시 예정" : "아직 게시되지 않음"}
        />
      </section>

      <section className="surface rounded-[28px] p-5 sm:p-8">
        <h2 className="text-lg font-black text-stone-900">게시 정보</h2>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-500"><CalendarClock className="size-4 text-[#ef6b32]" />{timeLabel}<span className="ml-auto text-stone-700">{formatDate(displayTime, true)}</span></div>

        <div className="mt-7"><h3 className="text-sm font-black">게시글 문구</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{data.body}</p></div>
        {data.hashtags.length > 0 && <div className="mt-6 flex flex-wrap gap-x-2 gap-y-1">{data.hashtags.map((tag) => <span key={tag} className="text-sm font-bold text-orange-600">#{tag}</span>)}</div>}

        {data.status === "published" && data.insight && <div className="mt-8 border-t border-stone-100 pt-7"><h3 className="text-sm font-black">게시 성과</h3><div className="mt-3 grid grid-cols-4 gap-2">{[
          { icon: Eye, label: "조회", value: data.insight.views },
          { icon: Heart, label: "좋아요", value: data.insight.likes },
          { icon: Save, label: "저장", value: data.insight.saves },
          { icon: MessageCircle, label: "댓글", value: data.insight.comments },
        ].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl bg-stone-50 p-3 text-center"><Icon className="mx-auto size-4 text-[#ef6b32]" /><strong className="mt-2 block text-base">{value.toLocaleString()}</strong><span className="text-[10px] text-stone-400">{label}</span></div>)}</div></div>}

        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <Link href={`/contents/${id}/edit`} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold hover:bg-stone-50"><Pencil className="size-4" />수정하기</Link>
          {canPublish && <Link href={`/contents/${id}/edit`} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ef6b32] px-4 text-sm font-bold text-white"><Send className="size-4" />게시하기</Link>}
          {data.status === "scheduled" && <Button variant="secondary" onClick={() => setConfirm("cancel")}><CalendarClock className="size-4" />예약 취소</Button>}
        </div>
        <button type="button" onClick={() => setConfirm("delete")} className="focus-ring mx-auto mt-5 flex items-center gap-1 rounded-lg p-2 text-xs font-bold text-stone-400 hover:text-red-600"><Trash2 className="size-4" />이 콘텐츠 삭제</button>
      </section>
    </div>

    <ConfirmDialog
      open={confirm !== null}
      title={confirm === "delete" ? "콘텐츠를 삭제할까요?" : "예약 게시를 취소할까요?"}
      description={confirm === "delete" ? "삭제한 콘텐츠는 되돌릴 수 없어요." : "콘텐츠는 삭제되지 않고 ‘임시 저장’ 상태로 돌아갑니다."}
      confirmLabel={confirm === "delete" ? "삭제하기" : "예약 취소"}
      onClose={() => setConfirm(null)}
      onConfirm={() => confirm === "delete" ? remove.mutate() : cancel.mutate()}
    />
  </div>;
}
