"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, X } from "lucide-react";
import { Button, Logo, PageHeader } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { backendApi, type BusinessRegistrationAvailability } from "@/lib/api/backend-api";
import { LegalFooter } from "@/components/common/legal-footer";

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
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const [businessAvailability, setBusinessAvailability] = useState<BusinessRegistrationAvailability | null>(null);
  const [businessCheckMessage, setBusinessCheckMessage] = useState("");
  const { register, setValue, handleSubmit, control, formState: { errors, isValid } } = useForm<Values>({
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
  const address = useWatch({ control, name: "address" });

  const checkBusinessNumber = useMutation({
    mutationFn: backendApi.getBusinessRegistrationAvailability,
    onSuccess: (result) => { setBusinessAvailability(result); setBusinessCheckMessage(""); },
    onError: (error) => { setBusinessAvailability(null); setBusinessCheckMessage(error instanceof Error ? error.message : "사업자등록번호를 확인하지 못했어요."); },
  });
  const businessRegistrationField = register("businessRegistrationNumber", {
    onChange: (event) => {
      const value = event.target.value;
      setBusinessAvailability(null);
      setBusinessCheckMessage("");
      if (/^\d{10}$/.test(value)) checkBusinessNumber.mutate(value);
    },
  });

  const createStore = useMutation({
    mutationFn: backendApi.createFirstStore,
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
        setHasSelectedAddress(true);
      },
    }).open({ popupTitle: "빵소문 주소 검색" });
  };

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col sm:min-h-[calc(100vh-4rem)]">
      <header><Logo href="/" /></header>
      <div className="flex-1 py-12 sm:py-16">
      <PageHeader title="첫 매장 등록" />
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
            <div className="relative">
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
              className="field cursor-pointer pr-11"
              placeholder={postcodeReady ? "눌러서 주소를 검색하세요." : "주소 검색 준비 중"}
              />
              {(hasSelectedAddress || address) && <button type="button" onClick={() => { setValue("address", "", { shouldDirty: true, shouldValidate: true }); setValue("postalCode", "", { shouldDirty: true, shouldValidate: true }); setValue("addressDetail", "", { shouldDirty: true }); setHasSelectedAddress(false); }} aria-label="선택한 주소 지우기" className="focus-ring absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-white text-stone-400 shadow-sm hover:bg-stone-100 hover:text-stone-700"><X className="size-4" /></button>}
            </div>
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
            <div className="relative"><input {...businessRegistrationField} required inputMode="numeric" pattern="[0-9]*" maxLength={10} className={`field pr-11 ${businessAvailability?.available ? "!border-emerald-400" : businessCheckMessage || businessAvailability?.available === false ? "!border-red-400" : ""}`} placeholder="1234567890" />{businessAvailability?.available && <CheckCircle2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-emerald-600" aria-label="사업자등록번호 확인 완료" />}</div>
            {errors.businessRegistrationNumber && <span className="mt-2 block text-xs text-red-600">{errors.businessRegistrationNumber.message}</span>}
            {checkBusinessNumber.isPending && <span className="mt-2 block text-xs text-stone-500">사업자등록번호를 확인하고 있어요.</span>}
            {businessAvailability?.available && <span className="mt-2 block text-xs text-emerald-700">계속사업자로 확인됐어요.</span>}
            {!businessAvailability?.available && businessAvailability && <span className="mt-2 block text-xs text-red-600">{businessAvailability.reason === "ALREADY_REGISTERED" ? "이미 등록된 사업자등록번호입니다." : `${businessAvailability.status}는 등록할 수 없습니다.`}</span>}
            {businessCheckMessage && <span className="mt-2 block text-xs text-red-600">{businessCheckMessage}</span>}
          </label>
        </div>

        <Button type="submit" disabled={!isValid || !businessAvailability?.available || checkBusinessNumber.isPending || createStore.isPending} className="min-h-13 w-full text-base">{createStore.isPending ? "매장을 등록하고 있어요" : "매장 등록 완료"}</Button>
      </form>
      </div>
      <LegalFooter className="border-t pt-5" />
      </div>
    </main>
  );
}
