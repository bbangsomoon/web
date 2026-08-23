"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/features/auth/auth-shell";
import { Button } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";

const schema = z.object({
  name: z.string().trim().min(1, "매장명을 입력해 주세요."),
  postalCode: z.string().min(1, "주소를 검색해 주세요."),
  address: z.string().min(1, "주소를 검색해 주세요."),
  addressDetail: z.string().trim(),
  phone: z.string().trim().regex(/^\d{9,11}$/, "매장 전화번호를 '-' 없이 숫자 9~11자리로 입력해 주세요."),
  businessRegistrationNumber: z.string().regex(/^\d{10}$/, "사업자등록번호를 '-' 없이 숫자 10자리로 입력해 주세요."),
  representativeName: z.string().trim().min(1, "대표자명을 입력해 주세요."),
});

type Values = z.infer<typeof schema>;

export default function FirstStorePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [postcodeReady, setPostcodeReady] = useState(false);
  const { register, setValue, handleSubmit, formState: { errors, isValid } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      postalCode: "",
      address: "",
      addressDetail: "",
      phone: "",
      businessRegistrationNumber: "",
      representativeName: "",
    },
  });

  const createStore = useMutation({
    mutationFn: mockApi.createFirstStore,
    onSuccess: (store) => {
      queryClient.setQueryData(["store"], store);
      queryClient.setQueryData(["stores"], [store]);
      toast("첫 매장 등록이 완료됐어요.");
      router.replace("/dashboard");
    },
  });

  const openAddressSearch = () => {
    if (!window.kakao?.Postcode) {
      toast("주소 검색 서비스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
      return;
    }
    new window.kakao.Postcode({
      oncomplete: (data) => {
        setValue("postalCode", data.zonecode, { shouldDirty: true, shouldValidate: true });
        setValue("address", data.roadAddress || data.jibunAddress || data.address, { shouldDirty: true, shouldValidate: true });
      },
    }).open({ popupTitle: "빵소문 주소 검색" });
  };

  return (
    <AuthShell eyebrow="가입 완료" title="첫 매장 등록">
      <Script
        id="kakao-postcode-onboarding"
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setPostcodeReady(true)}
        onError={() => toast("주소 검색 서비스를 불러오지 못했어요.", "error")}
      />
      <form onSubmit={handleSubmit((values) => createStore.mutate(values))} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">매장명 <b className="text-[#d95320]">*</b></span>
          <input {...register("name")} required className="field" placeholder="소문빵집" />
          {errors.name && <span className="mt-2 block text-xs text-red-600">{errors.name.message}</span>}
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold">주소 <b className="text-[#d95320]">*</b></span>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
            <input
              {...register("address")}
              required
              readOnly
              role="button"
              aria-haspopup="dialog"
              aria-label="주소 검색 열기"
              onClick={openAddressSearch}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openAddressSearch();
                }
              }}
              className="field cursor-pointer"
              placeholder={postcodeReady ? "눌러서 주소를 검색하세요." : "주소 검색 준비 중"}
            />
            <input {...register("postalCode")} readOnly aria-label="우편번호" className="field px-2 text-center text-sm text-stone-500" placeholder="우편번호" />
          </div>
          {errors.address && <span className="mt-2 block text-xs text-red-600">{errors.address.message}</span>}
          <input {...register("addressDetail")} className="field mt-2" placeholder="상세 주소를 입력해 주세요." />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">매장 전화번호 <b className="text-[#d95320]">*</b></span>
          <input {...register("phone")} required type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={11} className="field" placeholder="0212345678" />
          {errors.phone && <span className="mt-2 block text-xs text-red-600">{errors.phone.message}</span>}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold">대표자명 <b className="text-[#d95320]">*</b></span>
            <input {...register("representativeName")} required className="field" placeholder="김소문" />
            {errors.representativeName && <span className="mt-2 block text-xs text-red-600">{errors.representativeName.message}</span>}
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">사업자등록번호 <b className="text-[#d95320]">*</b></span>
            <input {...register("businessRegistrationNumber")} required inputMode="numeric" pattern="[0-9]*" maxLength={10} className="field" placeholder="1234567890" />
            {errors.businessRegistrationNumber && <span className="mt-2 block text-xs text-red-600">{errors.businessRegistrationNumber.message}</span>}
          </label>
        </div>

        <Button type="submit" disabled={!isValid || createStore.isPending} className="min-h-13 w-full text-base">{createStore.isPending ? "매장을 등록하고 있어요" : "매장 등록 완료"}</Button>
      </form>
    </AuthShell>
  );
}
