"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, PageHeader } from "@/components/common/ui";
import { ContentStepIndicator } from "@/components/content/content-step-indicator";
import { MediaPreview } from "@/components/content/media-preview";
import { useContentGeneration, useToast } from "@/components/common/providers";
import { contentFormSchema, type ContentFormValues } from "@/features/content/schemas";
import { useSelectedStore } from "@/lib/active-store";
import { contentApi, type ContentMedia } from "@/lib/api/content-api";
import type { ContentAsset } from "@/types";

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const defaultValues: ContentFormValues = { prompt: "" };
type UploadedMedia = { url: string; type: ContentAsset["type"]; alt: string; file: File };

const convertToJpeg = (file: File) => new Promise<File>((resolve, reject) => {
  const image = new Image();
  const sourceUrl = URL.createObjectURL(file);
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("이미지를 변환할 수 없어요."));
      return;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(sourceUrl);
      if (!blob) {
        reject(new Error("이미지를 변환할 수 없어요."));
        return;
      }
      const filename = file.name.replace(/\.[^.]+$/, "") || "instagram-feed";
      resolve(new File([blob], `${filename}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };
  image.onerror = () => {
    URL.revokeObjectURL(sourceUrl);
    reject(new Error("지원하지 않는 이미지 형식이에요."));
  };
  image.src = sourceUrl;
});

export default function NewContentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { generationJob, startGeneration, trackGeneration, completeGeneration, clearGeneration } = useContentGeneration();
  const { storeId, stores } = useSelectedStore();
  const [previews, setPreviews] = useState<UploadedMedia[]>([]);
  const [mediaError, setMediaError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const generationRef = useRef<{ key: string; media?: ContentMedia[] } | null>(null);
  const { register, control, trigger, reset, formState: { errors } } = useForm<ContentFormValues>({ resolver: zodResolver(contentFormSchema), defaultValues });
  const values = useWatch({ control }) as ContentFormValues;
  const canContinue = Boolean(storeId) && previews.length > 0 && values.prompt.length <= 1000;
  const canAddMedia = previews.length < MAX_IMAGE_COUNT;

  useEffect(() => {
    try {
      const draft = localStorage.getItem("bbangsomoon.new-draft");
      if (draft) reset({ ...defaultValues, ...JSON.parse(draft) });
    } catch {}
  }, [reset]);

  useEffect(() => {
    localStorage.setItem("bbangsomoon.new-draft", JSON.stringify(values));
  }, [values]);
  useEffect(() => {
    if (generationJob?.status !== "completed" || generationJob.storeId !== storeId || !generationJob.contentId) return;
    clearGeneration();
    router.replace(`/contents/${generationJob.contentId}/edit?flow=generate`);
  }, [clearGeneration, generationJob, router, storeId]);

  const mutation = useMutation({
    onMutate: startGeneration,
    mutationFn: async () => {
      const request = generationRef.current ?? { key: crypto.randomUUID() };
      generationRef.current = request;
      request.media ??= await contentApi.uploadImages(previews.map((preview) => preview.file));
      return contentApi.createCaption(storeId, request.media, values.prompt, request.key);
    },
    onSuccess: (content) => {
      generationRef.current = null;
      localStorage.removeItem("bbangsomoon.new-draft");
      queryClient.invalidateQueries({ queryKey: ["contents", storeId] });
      if (content.status === "generating") {
        trackGeneration(storeId, content.id);
        toast("AI 콘텐츠 생성을 시작했어요.", "info");
        return;
      }
      toast("AI 콘텐츠가 완성됐어요!");
      completeGeneration(storeId, content.id);
    },
    onError: clearGeneration,
  });

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    let remaining = MAX_IMAGE_COUNT - previews.length;
    let excluded = false;
    const media: UploadedMedia[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE || remaining <= 0) {
        excluded = true;
        continue;
      }
      try {
        const jpegFile = await convertToJpeg(file);
        if (jpegFile.size > MAX_IMAGE_SIZE) {
          excluded = true;
          continue;
        }
        media.push({ url: URL.createObjectURL(jpegFile), type: "image", alt: jpegFile.name, file: jpegFile });
        remaining -= 1;
      } catch {
        excluded = true;
      }
    }

    if (media.length > 0) {
      generationRef.current = null;
      setPreviews((current) => [...current, ...media]);
    }
    setMediaError(excluded ? "사진은 JPG 변환 후 장당 8MB 이하, 최대 5장까지 첨부할 수 있어요. 브라우저에서 읽을 수 없는 형식은 JPG로 변환할 수 없어요." : "");
  };

  const removeMedia = (index: number) => {
    const asset = previews[index];
    if (asset?.url.startsWith("blob:")) URL.revokeObjectURL(asset.url);
    generationRef.current = null;
    setPreviews((current) => current.filter((_, mediaIndex) => mediaIndex !== index));
  };

  const generate = async () => {
    if (previews.length === 0) {
      setMediaError("게시할 사진을 한 장 이상 첨부해 주세요.");
      return;
    }
    if (!storeId) {
      setMediaError(stores.isLoading ? "매장 정보를 불러오는 중이에요." : "콘텐츠를 만들 매장을 선택해 주세요.");
      return;
    }
    if (!(await trigger("prompt"))) return;
    mutation.mutate();
  };

  return <div className="mx-auto max-w-5xl">
    <PageHeader title="새 콘텐츠 만들기" backHref="/dashboard" />
    <ContentStepIndicator step={1} />

    <div className="surface rounded-[28px] p-5 sm:p-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">사진을 첨부해 주세요 <b className="text-[#ef6b32]">*</b></h2>
          <p className="text-xs font-semibold text-stone-500" aria-live="polite">사진 {previews.length}/{MAX_IMAGE_COUNT}</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }} />
          {previews.length === 0 ? <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring mt-3 grid aspect-[2/1] w-full place-items-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-4 text-center transition hover:bg-orange-50 sm:aspect-[4/1]"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-[#ef6b32] shadow-sm"><ImagePlus className="size-6" /></div><p className="mt-3 font-black">사진 선택</p><p className="mt-1 text-xs text-stone-500">사진 최대 5장 · JPG 변환 후 장당 8MB까지</p><p className="mt-1 text-xs text-stone-400">업로드한 사진은 Instagram 피드용 JPG로 변환돼요</p></div></button> : <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {previews.map((asset, index) => <div key={asset.url} className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100"><MediaPreview asset={asset} /><span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-black/65 text-xs font-black text-white backdrop-blur">{index + 1}</span><button type="button" onClick={() => removeMedia(index)} aria-label={`사진 ${index + 1} 삭제`} className="focus-ring absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/65 text-white backdrop-blur"><Trash2 className="size-4" /></button></div>)}
          {canAddMedia && <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-orange-200 hover:text-[#ef6b32]"><span className="flex flex-col items-center gap-2 text-xs font-bold"><ImagePlus className="size-6" />사진 추가</span></button>}
        </div>}
        {mediaError && <p className="mt-3 text-sm font-semibold text-red-600">{mediaError}</p>}
        <label className="mt-4 flex cursor-not-allowed items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm opacity-70">
          <input type="checkbox" disabled className="size-4 rounded border-stone-300" />
          <span><b className="font-bold text-stone-700">썸네일도 함께 만들기</b><span className="ml-2 rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-black text-stone-500">준비 중</span><span className="mt-0.5 block text-xs text-stone-500">콘텐츠 서버 연동 후 대표 이미지를 함께 제작할 수 있어요.</span></span>
        </label>

        <label className="mt-7 block border-t border-stone-200 pt-7">
          <span className="mb-2 block text-sm font-bold">AI에게 부탁할 내용 <span className="font-medium text-stone-400">(선택)</span></span>
          <textarea {...register("prompt")} rows={7} className="field resize-none leading-6" placeholder="예: 오늘 비가 와서 오후 6시부터 남은 빵을 20% 할인한다고 따뜻한 말투로 알려줘." />
          {errors.prompt && <span className="mt-2 block text-xs font-semibold text-red-600">{errors.prompt.message}</span>}
        </label>
      </section>
    </div>

    <div className="sticky bottom-[76px] z-20 -mx-4 mt-5 flex border-t border-stone-200 bg-[#fbfaf6]/95 px-4 py-4 backdrop-blur lg:bottom-0 lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
      <Button className="min-h-13 flex-1" onClick={generate} disabled={!canContinue || mutation.isPending || generationJob?.status === "generating"}>{mutation.isPending || generationJob?.status === "generating" ? "AI 콘텐츠 생성 중" : "AI 콘텐츠 만들기"}</Button>
    </div>
  </div>;
}
