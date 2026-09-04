"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Hash, Plus, X, Zap } from "lucide-react";
import { Button, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { InstagramIcon } from "@/components/common/brand-icons";
import { InstagramFeedPreview } from "@/components/content/instagram-feed-preview";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";
import { cn } from "@/lib/utils";
import type { Content } from "@/types";

const toDateInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const TODAY = toDateInputValue(today);
const DEFAULT_DATE = toDateInputValue(tomorrow);
const toTimeInputValue = (date: Date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

function ContentEditor({ data }: { data: Content }) {
  const id = data.id;
  const router = useRouter();
  const client = useQueryClient();
  const toast = useToast();
  const publishActionsRef = useRef<HTMLDivElement>(null);
  const storedSchedule = data.scheduledAt ? new Date(data.scheduledAt) : null;
  const hasStoredSchedule = Boolean(storedSchedule && !Number.isNaN(storedSchedule.getTime()));
  const [body, setBody] = useState(data.body);
  const [hashtags, setHashtags] = useState<string[]>(data.hashtags);
  const [tag, setTag] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "scheduled">(hasStoredSchedule ? "scheduled" : "now");
  const [date, setDate] = useState(hasStoredSchedule ? toDateInputValue(storedSchedule!) : DEFAULT_DATE);
  const [time, setTime] = useState(hasStoredSchedule ? toTimeInputValue(storedSchedule!) : "11:00");
  const social = useQuery({ queryKey: ["social"], queryFn: mockApi.getSocial });

  const saveDraft = useMutation({
    mutationFn: () => mockApi.updateContent(id, { body, hashtags, status: "draft", scheduledAt: undefined }),
    onSuccess: (next) => {
      client.setQueryData(["content", id], next);
      client.invalidateQueries({ queryKey: ["contents"] });
      toast("콘텐츠를 임시 저장했어요.");
      router.push("/contents");
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      await mockApi.updateContent(id, { body, hashtags, status: "draft", scheduledAt: undefined });
      return mockApi.publishContent(id, publishMode, publishMode === "scheduled" ? new Date(`${date}T${time}`).toISOString() : undefined);
    },
    onSuccess: (next) => {
      client.setQueryData(["content", id], next);
      client.invalidateQueries({ queryKey: ["contents"] });
      toast(publishMode === "now" ? "Instagram 피드에 게시했어요!" : "게시 시간을 예약했어요!");
      router.push(`/contents/${id}`);
    },
  });

  const addTag = () => {
    const next = tag.trim().replace(/^#/, "").replaceAll(" ", "");
    if (next && !hashtags.includes(next)) setHashtags((current) => [...current, next]);
    setTag("");
  };

  const selectPublishMode = (mode: "now" | "scheduled") => {
    setPublishMode(mode);
    if (mode === "scheduled") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        publishActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }));
    }
  };

  const isBusy = saveDraft.isPending || publish.isPending;
  const scheduleIncomplete = publishMode === "scheduled" && (!date || !time);
  const publishDisabled = isBusy || scheduleIncomplete;

  return <div className="mx-auto max-w-4xl">
    <PageHeader className="mb-10" title="콘텐츠 수정하기" backHref={`/contents/${id}`} />
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,.8fr)_1.2fr]">
      <aside className="relative"><div className="sticky top-6"><h2 className="mb-3 text-sm font-bold lg:absolute lg:-top-6 lg:left-0 lg:mb-0">Instagram 피드 미리보기</h2><InstagramFeedPreview assets={data.assets} body={body} hashtags={hashtags} handle={social.data?.handle ?? "@somoon_bakery"} /></div></aside>
      <section className="surface rounded-[28px] p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">게시글 문구</h2>
        </div>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={12} className="field resize-none leading-7" aria-label="게시글 문구" />
        <div className="mt-2 text-right text-xs font-semibold text-stone-400">{body.length}자</div>

        <div className="mt-7">
          <h3 className="flex items-center gap-2 text-sm font-black"><Hash className="size-4 text-[#ef6b32]" />해시태그</h3>
          <div className="mt-3 flex flex-wrap gap-2">{hashtags.map((item) => <span key={item} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-orange-50 pl-3 pr-2 text-sm font-bold text-orange-700">#{item}<button type="button" aria-label={`${item} 삭제`} onClick={() => setHashtags((current) => current.filter((value) => value !== item))} className="grid size-6 place-items-center rounded-full hover:bg-orange-100"><X className="size-3.5" /></button></span>)}</div>
          <div className="mt-3 flex gap-2"><input value={tag} onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} className="field" placeholder="해시태그 추가" /><Button type="button" variant="secondary" onClick={addTag} aria-label="해시태그 추가"><Plus className="size-5" /></Button></div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white"><InstagramIcon className="size-5" /></span><div><h3 className="text-sm font-black">인스타그램 피드 게시</h3><p className="mt-1 text-xs text-stone-500">{social.data?.handle ?? "@somoon_bakery"}</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => selectPublishMode("now")} className={cn("focus-ring flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left", publishMode === "now" ? "border-[#ef6b32] bg-orange-50" : "border-stone-200 hover:border-stone-300")}><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", publishMode === "now" ? "bg-[#ef6b32] text-white" : "bg-stone-100 text-stone-500")}><Zap className="size-5" /></span><span><b className="block text-sm">지금 게시</b><small className="mt-1 block text-stone-500">바로 피드에 올려요</small></span></button>
            <button type="button" onClick={() => selectPublishMode("scheduled")} className={cn("focus-ring flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left", publishMode === "scheduled" ? "border-[#ef6b32] bg-orange-50" : "border-stone-200 hover:border-stone-300")}><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", publishMode === "scheduled" ? "bg-[#ef6b32] text-white" : "bg-stone-100 text-stone-500")}><CalendarClock className="size-5" /></span><span><b className="block text-sm">예약 게시</b><small className="mt-1 block text-stone-500">원하는 시간에 올려요</small></span></button>
          </div>
          {publishMode === "scheduled" && <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50 p-4"><label><span className="mb-2 block text-xs font-bold text-stone-500">날짜</span><input type="date" min={TODAY} value={date} onChange={(event) => setDate(event.target.value)} className="field" /></label><label><span className="mb-2 block text-xs font-bold text-stone-500">시간</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field" /></label></div>}
        </div>

        <div ref={publishActionsRef} className="mt-8 grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="secondary" onClick={() => router.push(`/contents/${id}`)} disabled={isBusy}>취소</Button>
          <Button variant="secondary" onClick={() => saveDraft.mutate()} disabled={isBusy}>임시 저장</Button>
          <Button onClick={() => publish.mutate()} disabled={publishDisabled}>게시하기</Button>
        </div>
      </section>
    </div>
  </div>;
}

export default function EditContentPage() {
  const { contentId: id } = useParams<{ contentId: string }>();
  const { data, isLoading, isError } = useQuery({ queryKey: ["content", id], queryFn: () => mockApi.getContent(id) });
  if (isLoading) return <LoadingState label="콘텐츠를 불러오고 있어요" />;
  if (isError || !data) return <ErrorState message="콘텐츠를 찾을 수 없어요." />;
  return <ContentEditor key={data.id} data={data} />;
}
