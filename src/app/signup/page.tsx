"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ChevronRight, Eye, EyeOff, X } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { Button } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { backendApi } from "@/lib/api/backend-api";

const schema = z.object({
  name: z.string().trim().min(2, "이름을 2자 이상 입력해 주세요."),
  phone: z.string().trim()
    .min(1, "휴대폰 번호를 입력해 주세요.")
    .regex(/^\d+$/, "휴대폰 번호는 숫자만 입력해 주세요.")
    .refine((value) => value.length === 10 || value.length === 11, "휴대폰 번호는 숫자 10~11자리로 입력해 주세요.")
    .refine((value) => /^01[016789]/.test(value), "휴대폰 번호는 010, 011, 016~019로 시작해야 합니다."),
  email: z.string().trim().email("올바른 이메일 주소를 입력해 주세요."),
  verificationCode: z.string().regex(/^\d{6}$/, "인증번호 6자리를 입력해 주세요."),
  password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,64}$/, "영문, 숫자, 특수문자를 모두 포함해 8~64자로 입력해 주세요."),
  confirmPassword: z.string(),
  privacyPolicy: z.boolean().refine(Boolean),
  serviceTerms: z.boolean().refine(Boolean),
}).refine((values) => values.password === values.confirmPassword, { message: "비밀번호가 일치하지 않습니다.", path: ["confirmPassword"] });

type Values = z.infer<typeof schema>;
type Policy = "privacy" | "terms";
const policyMeta = {
  privacy: { title: "개인정보처리방침", description: "개인정보처리방침은 현재 준비 중입니다." },
  terms: { title: "서비스 이용약관", description: "서비스 이용약관은 현재 준비 중입니다." },
} satisfies Record<Policy, { title: string; description: string }>;

function PolicyDialog({ policy, onClose }: { policy: Policy | null; onClose: () => void }) {
  if (!policy) return null;
  const content = policyMeta[policy];
  return <div className="fixed inset-0 z-[110] grid place-items-end bg-black/35 p-4 sm:place-items-center" onMouseDown={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="policy-dialog-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-center justify-between gap-4"><h2 id="policy-dialog-title" className="text-xl font-black text-stone-900">{content.title}</h2><button type="button" onClick={onClose} aria-label={`${content.title} 닫기`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="size-5" /></button></div>
      <div className="mt-5 grid min-h-48 place-items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center"><p className="text-sm font-semibold text-stone-500">{content.description}</p></div>
    </div>
  </div>;
}

export default function SignupPage() {
  const router = useRouter(); const toast = useToast();
  const [openPolicy, setOpenPolicy] = useState<Policy | null>(null);
  const [showPassword, setShowPassword] = useState(false); const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState(""); const [verifiedEmail, setVerifiedEmail] = useState("");
  const [consentTimes, setConsentTimes] = useState({ privacy: "", terms: "" });
  const { register, handleSubmit, formState: { errors, isValid }, getValues, trigger, setValue, control } = useForm<Values>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { privacyPolicy: false, serviceTerms: false, verificationCode: "" } });
  const [email, privacyPolicy, serviceTerms] = useWatch({ control, name: ["email", "privacyPolicy", "serviceTerms"] });
  const sendCode = useMutation({ mutationFn: (emailAddress: string) => backendApi.sendVerificationCode(emailAddress), onSuccess: (_, emailAddress) => { setCodeSentTo(emailAddress); setVerifiedEmail(""); toast("인증번호를 이메일로 보냈어요.", "info"); } });
  const confirmCode = useMutation({ mutationFn: ({ emailAddress, code }: { emailAddress: string; code: string }) => backendApi.confirmVerificationCode(emailAddress, code), onSuccess: (_, { emailAddress }) => { setVerifiedEmail(emailAddress); toast("이메일 인증이 완료됐어요."); } });
  const signup = useMutation({ mutationFn: (values: Values) => backendApi.signup({ name: values.name, phone: values.phone, email: values.email, password: values.password }, { termsAgreedAt: consentTimes.terms, privacyAgreedAt: consentTimes.privacy }), onSuccess: () => { toast("회원가입이 완료됐어요. 첫 매장을 등록해 주세요."); router.replace("/signup/store"); } });
  const setConsent = (policy: "privacy" | "terms", checked: boolean) => { setValue(policy === "privacy" ? "privacyPolicy" : "serviceTerms", checked, { shouldDirty: true, shouldValidate: true }); setConsentTimes((current) => ({ ...current, [policy]: checked ? new Date().toISOString() : "" })); };

  return <AuthShell title="회원가입" footer={<>이미 계정이 있나요? <Link href="/login" className="font-semibold text-[#d95320] hover:underline">로그인</Link></>}>
    <form onSubmit={handleSubmit((values) => signup.mutate(values))} className="grid gap-5 sm:grid-cols-2">
      <label><span className="mb-2 block text-sm font-semibold">이름 <b className="text-[#d95320]">*</b></span><input {...register("name")} required className="field" autoComplete="name" placeholder="김소문" />{errors.name && <span className="mt-2 block text-xs text-red-600">{errors.name.message}</span>}</label>
      <label><span className="mb-2 block text-sm font-semibold">휴대폰 번호 <b className="text-[#d95320]">*</b></span><input {...register("phone")} required type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={11} autoComplete="tel" className="field" placeholder="01012345678" />{errors.phone && <span className="mt-2 block text-xs text-red-600">{errors.phone.message}</span>}</label>
      <div className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">이메일 <b className="text-[#d95320]">*</b></span><div className="flex gap-2"><input {...register("email")} required type="email" autoComplete="email" className="field min-w-0 flex-1" placeholder="owner@bakery.com" /><Button type="button" variant="secondary" className="shrink-0" disabled={sendCode.isPending} onClick={async () => { if (await trigger("email")) sendCode.mutate(getValues("email")); }}>{sendCode.isPending ? "보내는 중" : "인증번호 받기"}</Button></div>{errors.email && <span className="mt-2 block text-xs text-red-600">{errors.email.message}</span>}</div>
      <div className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">이메일 인증번호 <b className="text-[#d95320]">*</b></span><div className="flex gap-2"><input {...register("verificationCode")} disabled={!codeSentTo} inputMode="numeric" maxLength={6} className="field min-w-0 flex-1" placeholder={codeSentTo ? "메일로 받은 6자리 인증번호" : "먼저 인증번호를 받아 주세요."} /><Button type="button" variant="secondary" className="shrink-0" disabled={!codeSentTo || confirmCode.isPending || verifiedEmail === email} onClick={async () => { if (await trigger("verificationCode")) confirmCode.mutate({ emailAddress: email, code: getValues("verificationCode") }); }}>{verifiedEmail === email ? "인증 완료" : confirmCode.isPending ? "확인 중" : "인증 확인"}</Button></div>{errors.verificationCode && <span className="mt-2 block text-xs text-red-600">{errors.verificationCode.message}</span>}</div>
      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">비밀번호 <b className="text-[#d95320]">*</b></span><span className="relative block"><input {...register("password")} required type={showPassword ? "text" : "password"} autoComplete="new-password" className="field pr-12" placeholder="영문·숫자·특수문자 포함 8~64자" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} className="focus-ring absolute right-3 top-2 grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-stone-100">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>{errors.password && <span className="mt-2 block text-xs text-red-600">{errors.password.message}</span>}</label>
      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">비밀번호 확인 <b className="text-[#d95320]">*</b></span><span className="relative block"><input {...register("confirmPassword")} required type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" className="field pr-12" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"} className="focus-ring absolute right-3 top-2 grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-stone-100">{showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>{errors.confirmPassword && <span className="mt-2 block text-xs text-red-600">{errors.confirmPassword.message}</span>}</label>
      <div className="space-y-3 sm:col-span-2"><div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-2"><label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm font-semibold text-stone-700"><input checked={privacyPolicy} onChange={(event) => setConsent("privacy", event.target.checked)} type="checkbox" className="size-5 shrink-0 accent-[#ef6b32]" /><span><b className="mr-1 text-[#d95320]">[필수]</b> 개인정보처리방침 동의</span></label><button type="button" onClick={() => setOpenPolicy("privacy")} aria-label="개인정보처리방침 내용 보기" className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-orange-50 hover:text-[#d95320]"><ChevronRight className="size-5" /></button></div><div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-2"><label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm font-semibold text-stone-700"><input checked={serviceTerms} onChange={(event) => setConsent("terms", event.target.checked)} type="checkbox" className="size-5 shrink-0 accent-[#ef6b32]" /><span><b className="mr-1 text-[#d95320]">[필수]</b> 서비스 이용약관 동의</span></label><button type="button" onClick={() => setOpenPolicy("terms")} aria-label="서비스 이용약관 내용 보기" className="focus-ring grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-orange-50 hover:text-[#d95320]"><ChevronRight className="size-5" /></button></div></div>
      <Button type="submit" disabled={!isValid || verifiedEmail !== email || signup.isPending} className="min-h-13 w-full text-base sm:col-span-2">{signup.isPending ? "가입하고 있어요" : "가입하기"}</Button>
    </form><PolicyDialog policy={openPolicy} onClose={() => setOpenPolicy(null)} />
  </AuthShell>;
}
