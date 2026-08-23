"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock3, Copy, Eye, Heart, Info, MapPin, Phone, Plus, Star, Store as StoreIcon, UtensilsCrossed } from "lucide-react";
import { z } from "zod";
import { Button, ErrorState, LoadingState, PageHeader } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { MenuManagerDialog } from "@/components/settings/menu-manager-dialog";
import { mockApi } from "@/lib/api/mock-api";
import { cn } from "@/lib/utils";
import type { StoreAmenity, StoreBusinessHour, StoreWeekday } from "@/types";

const amenityValues = ["parking", "takeout", "reservation", "delivery", "petFriendly", "wifi"] as const;
const amenityLabels: Record<StoreAmenity, string> = {
  parking: "주차 가능",
  takeout: "포장 가능",
  reservation: "예약 가능",
  delivery: "배달 가능",
  petFriendly: "반려동물 동반",
  wifi: "와이파이",
};

const weekdayValues = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const weekdayLabels: Record<StoreWeekday, string> = {
  monday: "월",
  tuesday: "화",
  wednesday: "수",
  thursday: "목",
  friday: "금",
  saturday: "토",
  sunday: "일",
};

const defaultWeeklyHours: StoreBusinessHour[] = weekdayValues.map((day) => ({ day, open: false, openTime: "09:00", closeTime: "18:00" }));
const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

function TimeSelect({ label, dayLabel, value, onChange }: { label: string; dayLabel: string; value: string; onChange: (value: string) => void }) {
  const [hour = "00", minute = "00"] = value.split(":");
  const availableMinutes = minuteOptions.includes(minute) ? minuteOptions : [...minuteOptions, minute].sort();
  return <div className="rounded-xl border border-stone-200 bg-white p-2.5"><span className="mb-2 block text-xs font-black text-stone-600">{label} 시간</span><div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"><select value={hour} onChange={(event) => onChange(`${event.target.value}:${minute}`)} aria-label={`${dayLabel}요일 ${label} 시간`} className="focus-ring min-h-10 min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-2 text-center text-sm font-bold">{hourOptions.map((option) => <option key={option} value={option}>{option}시</option>)}</select><span className="font-bold text-stone-400">:</span><select value={minute} onChange={(event) => onChange(`${hour}:${event.target.value}`)} aria-label={`${dayLabel}요일 ${label} 분`} className="focus-ring min-h-10 min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-2 text-center text-sm font-bold">{availableMinutes.map((option) => <option key={option} value={option}>{option}분</option>)}</select></div></div>;
}

const menuSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  price: z.number(),
  description: z.string(),
  imageUrl: z.string(),
  soldOut: z.boolean(),
});

const businessHourSchema = z.object({
  day: z.enum(weekdayValues),
  open: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

const schema = z.object({
  name: z.string().min(1, "매장 이름을 적어 주세요."),
  description: z.string(),
  postalCode: z.string(),
  address: z.string().min(1, "주소를 적어 주세요."),
  addressDetail: z.string(),
  phone: z.string().min(1, "전화번호를 적어 주세요."),
  representativeName: z.string().min(1, "대표자명을 적어 주세요."),
  businessRegistrationNumber: z.string().refine((value) => value.replace(/\D/g, "").length === 10, "사업자등록번호 10자리를 확인해 주세요."),
  weeklyHours: z.array(businessHourSchema),
  businessHours: z.string(),
  temporaryClosureStart: z.string(),
  temporaryClosureEnd: z.string(),
  temporaryClosureReason: z.string(),
  amenities: z.array(z.enum(amenityValues)),
  menus: z.array(menuSchema),
});

type Values = z.infer<typeof schema>;
type StoreTab = "basic" | "hours" | "menus" | "amenities";

const storeTabs: Array<{ value: StoreTab; label: string }> = [
  { value: "basic", label: "기본 정보" },
  { value: "hours", label: "영업 정보" },
  { value: "menus", label: "메뉴" },
  { value: "amenities", label: "이용 정보" },
];

const formatPhoneNumber = (value?: string) => {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length < 7) return value ?? "";
  const areaLength = digits.startsWith("02") ? 2 : 3;
  const middle = digits.slice(areaLength, -4);
  if (!middle) return value ?? "";
  return `${digits.slice(0, areaLength)}-${middle}-${digits.slice(-4)}`;
};

const defaultValues: Values = {
  name: "",
  description: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  phone: "",
  representativeName: "",
  businessRegistrationNumber: "",
  weeklyHours: defaultWeeklyHours,
  businessHours: "",
  temporaryClosureStart: "",
  temporaryClosureEnd: "",
  temporaryClosureReason: "",
  amenities: [],
  menus: [],
};

export default function StoreSettingsPage() {
  const client = useQueryClient();
  const toast = useToast();
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [activeTab, setActiveTab] = useState<StoreTab>("basic");
  const query = useQuery({ queryKey: ["store"], queryFn: mockApi.getStore });
  const {
    register,
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues });
  const values = useWatch({ control });
  const amenities = useWatch({ control, name: "amenities" });
  const menus = useWatch({ control, name: "menus" });
  const weeklyHours = useWatch({ control, name: "weeklyHours" });

  useEffect(() => {
    if (!query.data) return;
    reset({
      name: query.data.name,
      description: query.data.description,
      postalCode: query.data.postalCode,
      address: query.data.address,
      addressDetail: query.data.addressDetail,
      phone: query.data.phone,
      representativeName: query.data.representativeName,
      businessRegistrationNumber: query.data.businessRegistrationNumber,
      weeklyHours: query.data.weeklyHours,
      businessHours: query.data.businessHours,
      temporaryClosureStart: query.data.temporaryClosureStart,
      temporaryClosureEnd: query.data.temporaryClosureEnd,
      temporaryClosureReason: query.data.temporaryClosureReason,
      amenities: query.data.amenities,
      menus: query.data.menus,
    });
  }, [query.data, reset]);

  const save = useMutation({
    mutationFn: (nextValues: Values) => mockApi.updateStore({ ...query.data!, ...nextValues }),
    onSuccess: (next) => {
      client.setQueryData(["store"], next);
      toast("매장 정보를 저장했어요.");
    },
  });

  const toggleAmenity = (amenity: StoreAmenity) => {
    const next = amenities.includes(amenity)
      ? amenities.filter((item) => item !== amenity)
      : [...amenities, amenity];
    setValue("amenities", next, { shouldDirty: true });
  };

  const updateBusinessHour = (day: StoreWeekday, patch: Partial<StoreBusinessHour>) => {
    setValue("weeklyHours", weeklyHours.map((item) => item.day === day ? { ...item, ...patch } : item), { shouldDirty: true });
  };

  const selectTab = (tab: StoreTab) => {
    setActiveTab(tab);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const openAddressSearch = () => {
    if (!window.kakao?.Postcode) {
      toast("주소 검색 서비스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
      return;
    }
    new window.kakao.Postcode({
      oncomplete: (data) => {
        setValue("postalCode", data.zonecode, { shouldDirty: true });
        setValue("address", data.roadAddress || data.jibunAddress || data.address, { shouldDirty: true, shouldValidate: true });
        toast("주소를 선택했어요.", "info");
      },
    }).open({ popupTitle: "빵소문 주소 검색" });
  };

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState />;

  return (
    <>
      <PageHeader title="매장 관리" />
      <div className="mx-auto max-w-5xl">
      <Script
        id="kakao-postcode"
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setPostcodeReady(true)}
        onError={() => toast("주소 검색 서비스를 불러오지 못했어요.", "error")}
      />
      <form onSubmit={handleSubmit((nextValues) => save.mutate(nextValues), (formErrors) => { if (formErrors.name || formErrors.address || formErrors.phone || formErrors.representativeName || formErrors.businessRegistrationNumber) selectTab("basic"); })}>
        <div className="grid items-start gap-5 lg:grid-cols-[160px_minmax(0,1fr)]">
          <aside className="sticky top-[104px] hidden lg:block">
            <div className="surface rounded-2xl p-2">
              <div role="tablist" aria-label="매장 정보 항목" aria-orientation="vertical" className="space-y-1">
                {storeTabs.map((tab) => {
                  const selected = activeTab === tab.value;
                  return <button key={tab.value} type="button" role="tab" aria-selected={selected} onClick={() => selectTab(tab.value)} className={cn("focus-ring flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-bold transition", selected ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800")}>{tab.label}</button>;
                })}
              </div>
              <div className="mt-2 border-t border-stone-200 pt-2">
                <Button type="submit" disabled={save.isPending} className="min-h-11 w-full px-2">{save.isPending ? "저장 중" : "매장 정보 저장"}</Button>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
        <div role="tablist" aria-label="매장 정보 항목" className="mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm lg:hidden">
          {storeTabs.map((tab) => {
            const selected = activeTab === tab.value;
            return <button key={tab.value} type="button" role="tab" aria-selected={selected} onClick={() => selectTab(tab.value)} className={cn("focus-ring min-h-10 rounded-xl px-2 text-xs font-bold transition sm:text-sm", selected ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800")}>{tab.label}</button>;
          })}
        </div>

        {activeTab === "basic" && (
        <section className="surface mx-auto max-w-xl rounded-[28px] p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <StoreIcon className="size-5 text-[#ef6b32]" />
            <h2 className="text-lg font-black">기본 정보</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">매장 이름 <b className="text-[#ef6b32]">*</b></span>
              <input {...register("name")} required className="field" />
              {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">매장 소개</span>
              <textarea {...register("description")} rows={4} className="field resize-none" placeholder="손님에게 보여줄 매장 소개를 적어 주세요." />
            </label>
            <div className="sm:col-span-2">
              <span className="mb-2 flex items-center gap-1 text-sm font-bold"><MapPin className="size-4" />주소 <b className="text-[#ef6b32]">*</b></span>
              <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                <input
                  {...register("address")}
                  required
                  readOnly
                  role="button"
                  aria-haspopup="dialog"
                  aria-label="주소 검색 열기"
                  onClick={openAddressSearch}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAddressSearch(); } }}
                  className="field cursor-pointer"
                  placeholder={postcodeReady ? "눌러서 주소를 검색하세요." : "주소 검색 준비 중"}
                />
                <input {...register("postalCode")} readOnly aria-label="우편번호" className="field px-2 text-center text-sm text-stone-500" placeholder="우편번호" />
              </div>
              {errors.address && <span className="mt-1 block text-xs text-red-600">{errors.address.message}</span>}
              <input {...register("addressDetail")} className="field mt-2" placeholder="상세 주소를 입력해 주세요." />
            </div>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">전화번호 <b className="text-[#ef6b32]">*</b></span>
              <input {...register("phone")} required className="field" inputMode="tel" />
              {errors.phone && <span className="mt-1 block text-xs text-red-600">{errors.phone.message}</span>}
            </label>
            <div className="mt-1 border-t border-stone-200 pt-5 sm:col-span-2">
              <h3 className="text-base font-black">사업자 정보</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-bold">대표자명 <b className="text-[#ef6b32]">*</b></span><input {...register("representativeName")} required className="field" placeholder="예: 김소문" />{errors.representativeName && <span className="mt-1 block text-xs text-red-600">{errors.representativeName.message}</span>}</label>
                <label><span className="mb-2 block text-sm font-bold">사업자등록번호 <b className="text-[#ef6b32]">*</b></span><input {...register("businessRegistrationNumber")} required inputMode="numeric" maxLength={12} className="field" placeholder="123-45-67890" />{errors.businessRegistrationNumber && <span className="mt-1 block text-xs text-red-600">{errors.businessRegistrationNumber.message}</span>}</label>
              </div>
            </div>
          </div>
        </section>
        )}

        {activeTab === "hours" && (
        <section className="surface mx-auto max-w-xl rounded-[28px] p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-[#ef6b32]" />
            <h2 className="text-lg font-black">영업 정보</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-bold">요일별 영업시간</legend>
              <p className="mt-1 text-xs leading-5 text-stone-500">영업하는 요일을 선택한 뒤 시작과 종료 시간을 설정해 주세요.</p>
              <div className="mt-4 space-y-2">
                {weeklyHours.map((item) => item.open ? (
                  <div key={item.day} className="grid grid-cols-[52px_1fr] items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-3 transition sm:grid-cols-[64px_1fr]">
                    <button type="button" aria-pressed="true" onClick={() => updateBusinessHour(item.day, { open: false })} className="focus-ring grid size-11 place-items-center rounded-xl bg-[#ef6b32] text-sm font-black text-white transition">{weekdayLabels[item.day]}</button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TimeSelect label="시작" dayLabel={weekdayLabels[item.day]} value={item.openTime} onChange={(value) => updateBusinessHour(item.day, { openTime: value })} />
                      <TimeSelect label="종료" dayLabel={weekdayLabels[item.day]} value={item.closeTime} onChange={(value) => updateBusinessHour(item.day, { closeTime: value })} />
                    </div>
                  </div>
                ) : (
                  <button key={item.day} type="button" aria-pressed="false" onClick={() => updateBusinessHour(item.day, { open: true })} className="focus-ring grid w-full grid-cols-[52px_1fr] items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50 sm:grid-cols-[64px_1fr]">
                    <span className="grid size-11 place-items-center rounded-xl bg-stone-200 text-sm font-black text-stone-500">{weekdayLabels[item.day]}</span>
                    <span><b className="block text-sm text-stone-600">휴무</b><small className="mt-1 block text-xs text-stone-400">눌러서 영업시간 설정</small></span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="sm:col-span-2">
              <span className="block text-sm font-bold">추가 영업 안내</span>
              <span className="mb-2 mt-1 block text-xs leading-5 text-stone-400">브레이크 타임이나 특정 요일의 예외 운영 내용을 적어 주세요.</span>
              <textarea {...register("businessHours")} rows={3} className="field resize-none" placeholder="예: 브레이크 타임 13:00–14:00 · 공휴일은 오후 6시 마감" />
            </label>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">임시 휴무</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-xs font-bold text-stone-500">시작일</span><input type="date" {...register("temporaryClosureStart")} className="field" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-stone-500">종료일</span><input type="date" {...register("temporaryClosureEnd")} className="field" /></label>
              </div>
              <input {...register("temporaryClosureReason")} className="field mt-3" placeholder="휴무 사유 또는 안내 문구" />
            </div>
          </div>
        </section>
        )}

        {activeTab === "menus" && (
        <section className="surface mx-auto max-w-xl rounded-[28px] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-5 text-[#ef6b32]" />
                <h2 className="text-lg font-black">메뉴 관리</h2>
              </div>
              <p className="mt-2 text-sm text-stone-500">메뉴 {menus.length}개가 등록되어 있어요.</p>
            </div>
            <button type="button" onClick={() => setMenuDialogOpen(true)} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white hover:bg-stone-700">
              <Plus className="size-4" />메뉴 관리
            </button>
          </div>
          {menus.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {menus.slice(0, 8).map((menu) => <span key={menu.id} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700">{menu.name}{menu.soldOut && <b className="ml-1 text-stone-400">· 품절</b>}</span>)}
              {menus.length > 8 && <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-500">+{menus.length - 8}개</span>}
            </div>
          ) : (
            <button type="button" onClick={() => setMenuDialogOpen(true)} className="focus-ring mt-5 w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-sm font-bold text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-[#d95320]">첫 메뉴 등록하기</button>
          )}
        </section>
        )}

        {activeTab === "amenities" && (
        <section className="surface mx-auto max-w-xl rounded-[28px] p-5 sm:p-7">
          <div className="flex items-center gap-2"><Info className="size-5 text-[#ef6b32]" /><h2 className="text-lg font-black">이용 정보</h2></div>
          <p className="mt-2 text-sm text-stone-500">손님이 방문 전에 확인할 수 있는 정보를 선택해 주세요.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenityValues.map((amenity) => {
              const selected = amenities.includes(amenity);
              return <button key={amenity} type="button" aria-pressed={selected} onClick={() => toggleAmenity(amenity)} className={cn("focus-ring flex min-h-14 items-center justify-between rounded-2xl px-4 text-left text-sm font-bold transition", selected ? "border-2 border-[#ef6b32] bg-orange-50 text-[#d95320]" : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300")}><span>{amenityLabels[amenity]}</span><span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-[#ef6b32] bg-[#ef6b32] text-white" : "border-stone-300")}>{selected && <Check className="size-3" />}</span></button>;
            })}
          </div>
        </section>
        )}

        <section className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-orange-100 bg-orange-50/60">
          <div className="flex items-center gap-2 border-b border-orange-100 px-5 py-4 sm:px-7">
            <Eye className="size-5 text-[#ef6b32]" />
            <h2 className="font-black">빵밭 화면 미리보기</h2>
          </div>
          <div className="p-5 sm:p-7">
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-stone-700">매장 정보</h3>
                <div className="w-full overflow-hidden rounded-[17px] border border-stone-200 bg-[#fffdfa] shadow-[0_16px_42px_rgba(43,35,27,.12)]">
                  <div className="flex min-h-[52px] items-center justify-between px-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <ArrowLeft className="size-[21px] shrink-0 text-stone-900" />
                      <h4 className="truncate text-[15px] font-black tracking-[-.035em]">{values.name || "매장 이름"}</h4>
                    </div>
                    <Heart className="size-5 shrink-0 text-stone-500" />
                  </div>
                  <div className="px-5 pb-5">
                    <div className="space-y-1.5 text-[13px] leading-5 text-stone-500">
                      <div className="flex min-h-6 items-center gap-1">
                        <p className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0 text-[#ef6b32]" /><span>{values.address || "주소를 입력해 주세요."}</span></p>
                        <Copy className="size-[15px] shrink-0 text-stone-400" />
                      </div>
                      {values.phone && <div className="flex min-h-6 items-center gap-1"><p className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0 text-[#ef6b32]" /><span>{formatPhoneNumber(values.phone)}</span></p><Copy className="size-[15px] shrink-0 text-stone-400" /></div>}
                      <div className="flex items-center gap-2">
                        <span className="flex gap-px text-[#ef6b32] opacity-40" aria-label="등록된 별점 없음">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="size-4" />)}</span>
                        <span>평점 없음 · 빵명록 없음</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-stone-700">메뉴</h3>
                <div className="w-full overflow-hidden rounded-[17px] border border-stone-200 bg-[#fffdfa] shadow-[0_16px_42px_rgba(43,35,27,.12)]">
                  <div className="max-h-[430px] overflow-y-auto p-4">
                    {menus.length > 0 ? (
                      <div className="space-y-2.5">
                        {menus.map((menu) => (
                          <article key={menu.id} className="grid min-h-28 grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#e7dfd4] bg-white">
                            <div className="min-h-28 bg-[#f1ebe3] bg-cover bg-center" style={{ backgroundImage: `url(${menu.imageUrl || "/images/bakery-hero.png"})` }} role="img" aria-label={`${menu.name} 사진`} />
                            <div className="flex min-w-0 flex-col p-3">
                              <strong className="truncate text-sm">{menu.name}</strong>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-[1.45] text-stone-500">{menu.description || "메뉴 설명이 아직 없어요."}</p>
                              <b className="mt-auto text-[13px] text-stone-900">{menu.price.toLocaleString("ko-KR")}원</b>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : <p className="py-12 text-center text-xs text-stone-500">아직 등록된 메뉴가 없어요.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-xl justify-center lg:hidden"><Button type="submit" disabled={save.isPending} className="min-h-14 w-full text-base">{save.isPending ? "저장하고 있어요" : "매장 정보 저장"}</Button></div>
          </div>
        </div>
      </form>

      <MenuManagerDialog
        open={menuDialogOpen}
        menus={menus}
        onClose={() => setMenuDialogOpen(false)}
        onApply={(nextMenus) => {
          setValue("menus", nextMenus, { shouldDirty: true });
          toast("메뉴 변경을 적용했어요. 매장 정보를 저장해 주세요.", "info");
        }}
      />
      </div>
    </>
  );
}
