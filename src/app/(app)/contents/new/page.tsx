"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button, PageHeader } from "@/components/common/ui";
import { ContentStepIndicator } from "@/components/content/content-step-indicator";
import { MediaPreview } from "@/components/content/media-preview";
import { useToast } from "@/components/common/providers";
import { contentFormSchema, type ContentFormValues } from "@/features/content/schemas";
import { mockApi } from "@/lib/api/mock-api";
import type { ContentAsset } from "@/types";

const defaultValues: ContentFormValues = { prompt: "" };
type UploadedMedia = { url: string; type: ContentAsset["type"]; alt: string };

export default function NewContentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [previews, setPreviews] = useState<UploadedMedia[]>([]);
  const [mediaError, setMediaError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, control, trigger, reset, formState: { errors } } = useForm<ContentFormValues>({ resolver: zodResolver(contentFormSchema), defaultValues });
  const values = useWatch({ control }) as ContentFormValues;
  const canContinue = previews.length > 0 && Boolean(values.prompt?.trim()) && values.prompt.length <= 1000;
  const imageCount = previews.filter((asset) => asset.type === "image").length;
  const videoCount = previews.filter((asset) => asset.type === "video").length;
  const canAddMedia = imageCount < 3 || videoCount < 1;

  useEffect(() => {
    try {
      const draft = localStorage.getItem("bbangsomoon.new-draft");
      if (draft) reset({ ...defaultValues, ...JSON.parse(draft) });
    } catch {}
  }, [reset]);

  useEffect(() => {
    localStorage.setItem("bbangsomoon.new-draft", JSON.stringify(values));
  }, [values]);

  const mutation = useMutation({
    mutationFn: () => mockApi.createContent({
      prompt: values.prompt,
      media: previews.map(({ type, url }) => ({ type, url })),
    }),
    onSuccess: (content) => {
      localStorage.removeItem("bbangsomoon.new-draft");
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast("AI 콘텐츠가 완성됐어요!");
      router.push(`/contents/${content.id}/edit`);
    },
  });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    let remainingImages = 3 - imageCount;
    let remainingVideos = 1 - videoCount;
    let excluded = false;
    const media: UploadedMedia[] = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isValidImage = isImage && file.size <= 10 * 1024 * 1024;
      const isValidVideo = isVideo && file.size <= 100 * 1024 * 1024;

      if ((isValidImage && remainingImages <= 0) || (isValidVideo && remainingVideos <= 0) || (!isValidImage && !isValidVideo)) {
        excluded = true;
        return;
      }

      const type: ContentAsset["type"] = isValidVideo ? "video" : "image";
      if (type === "video") remainingVideos -= 1;
      else remainingImages -= 1;
      media.push({ url: URL.createObjectURL(file), type, alt: file.name });
    });

    if (media.length > 0) setPreviews((current) => [...current, ...media]);
    setMediaError(excluded ? "사진은 장당 10MB 이하로 최대 3장, 영상은 100MB 이하로 최대 1개까지 첨부할 수 있어요." : "");
  };

  const removeMedia = (index: number) => {
    const asset = previews[index];
    if (asset?.url.startsWith("blob:")) URL.revokeObjectURL(asset.url);
    setPreviews((current) => current.filter((_, mediaIndex) => mediaIndex !== index));
  };

  const generate = async () => {
    if (previews.length === 0) {
      setMediaError("게시할 사진이나 영상을 한 개 이상 첨부해 주세요.");
      return;
    }
    if (!(await trigger("prompt"))) return;
    mutation.mutate();
  };

  return <div className="mx-auto max-w-3xl">
    <PageHeader title="새 콘텐츠 만들기" backHref="/dashboard" />
    <ContentStepIndicator step={1} />

    <div className="surface rounded-[28px] p-5 sm:p-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">사진이나 영상을 첨부해 주세요 <b className="text-[#ef6b32]">*</b></h2>
          <p className="text-xs font-semibold text-stone-500" aria-live="polite">사진 {imageCount}/3 · 영상 {videoCount}/1</p>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ""; }} />
        {previews.length === 0 ? <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring mt-3 grid aspect-[2/1] w-full place-items-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-4 text-center transition hover:bg-orange-50 sm:aspect-[4/1]"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-[#ef6b32] shadow-sm"><ImagePlus className="size-6" /></div><p className="mt-3 font-black">사진 또는 영상 선택</p><p className="mt-1 text-xs text-stone-500">사진 최대 3장 · 영상 최대 1개</p><p className="mt-1 text-xs text-stone-400">사진은 장당 10MB, 영상은 100MB까지 첨부할 수 있어요</p></div></button> : <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((asset, index) => <div key={asset.url} className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100"><MediaPreview asset={asset} controls={asset.type === "video"} /><button type="button" onClick={() => removeMedia(index)} aria-label="미디어 삭제" className="focus-ring absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/65 text-white backdrop-blur"><Trash2 className="size-4" /></button></div>)}
          {canAddMedia && <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-orange-200 hover:text-[#ef6b32]"><span className="flex flex-col items-center gap-2 text-xs font-bold"><ImagePlus className="size-6" />미디어 추가</span></button>}
        </div>}
        {mediaError && <p className="mt-3 text-sm font-semibold text-red-600">{mediaError}</p>}
        {previews.length === 0 && <button type="button" onClick={() => { setPreviews([{ url: "/images/bakery-hero.png", type: "image", alt: "샘플 사진" }]); setMediaError(""); }} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-600 hover:bg-stone-200"><Upload className="size-4" />샘플 사진으로 먼저 체험하기</button>}

        <label className="mt-7 block border-t border-stone-200 pt-7">
          <span className="mb-2 block text-sm font-bold">AI에게 부탁할 내용 <b className="text-[#ef6b32]">*</b></span>
          <textarea {...register("prompt")} rows={7} className="field resize-none leading-6" placeholder="예: 오늘 비가 와서 오후 6시부터 남은 빵을 20% 할인한다고 따뜻한 말투로 알려줘." />
          {errors.prompt && <span className="mt-2 block text-xs font-semibold text-red-600">{errors.prompt.message}</span>}
        </label>
      </section>
    </div>

    <div className="sticky bottom-[76px] z-20 -mx-4 mt-5 flex border-t border-stone-200 bg-[#fbfaf6]/95 px-4 py-4 backdrop-blur lg:bottom-0 lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
      <Button className="min-h-13 flex-1" onClick={generate} disabled={!canContinue || mutation.isPending}>{mutation.isPending ? "AI가 콘텐츠를 만들고 있어요" : "AI 콘텐츠 만들기"}</Button>
    </div>
  </div>;
}
