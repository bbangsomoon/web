"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/features/auth/auth-shell";
import { Button } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { mockApi } from "@/lib/api/mock-api";

const schema=z.object({email:z.string().email("올바른 이메일 주소를 입력해 주세요."),password:z.string().min(8,"비밀번호는 8자 이상 입력해 주세요.")});
type Values=z.infer<typeof schema>;
export default function LoginPage(){
  const router=useRouter();const toast=useToast();const [show,setShow]=useState(false);const {register,handleSubmit,formState:{errors}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:{email:"owner@bbangsomoon.kr",password:"bbang1234"}});const login=useMutation({mutationFn:mockApi.login,onSuccess:()=>{toast("반가워요! 빵소문에 로그인했어요.");router.replace("/dashboard")}});
  return <AuthShell title="로그인" footer={<>아직 계정이 없나요? <Link href="/signup" className="font-semibold text-[#d95320] hover:underline">회원가입</Link></>}><form onSubmit={handleSubmit(v=>login.mutate(v))} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold">이메일</span><input {...register("email")} type="email" autoComplete="email" className="field" placeholder="owner@bakery.com"/>{errors.email&&<span className="mt-2 block text-xs text-red-600">{errors.email.message}</span>}</label><label className="block"><span className="mb-2 flex items-center justify-between text-sm font-semibold">비밀번호 <button type="button" className="text-xs text-stone-400 hover:text-stone-700">비밀번호를 잊었나요?</button></span><span className="relative block"><input {...register("password")} type={show?"text":"password"} autoComplete="current-password" className="field pr-12"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"비밀번호 숨기기":"비밀번호 보기"} className="absolute right-3 top-2 grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-stone-100">{show?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></span>{errors.password&&<span className="mt-2 block text-xs text-red-600">{errors.password.message}</span>}</label><Button type="submit" disabled={login.isPending} className="w-full min-h-13 text-base">{login.isPending?"로그인하고 있어요":"로그인"}</Button><p className="rounded-2xl bg-orange-50 p-4 text-xs leading-5 text-orange-900">체험용 이메일과 비밀번호가 미리 입력되어 있어요. 그대로 로그인해도 됩니다.</p></form></AuthShell>;
}
