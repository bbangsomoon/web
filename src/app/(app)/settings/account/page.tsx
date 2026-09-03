"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, PageHeader } from "@/components/common/ui";
import { useToast } from "@/components/common/providers";
import { backendApi } from "@/lib/api/backend-api";

const formatMobileNumber = (value?: string) => {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return value || "-";
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const client = useQueryClient();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const session = useQuery({ queryKey: ["session"], queryFn: backendApi.getSession });
  const logout = useMutation({ mutationFn: backendApi.logout, onSuccess: () => { client.removeQueries(); toast("로그아웃했어요.", "info"); router.replace("/login"); } });
  const withdraw = useMutation({ mutationFn: backendApi.withdrawAccount, onSuccess: () => { client.removeQueries(); setConfirmOpen(false); toast("회원탈퇴가 완료됐어요.", "info"); router.replace("/"); } });
  const user = session.data?.user;

  return <>
    <PageHeader title="계정 관리" />
    <div className="mx-auto max-w-3xl">
    <section className="surface rounded-[28px] p-5 sm:p-7">
      <h2 className="text-lg font-semibold">계정 정보</h2>
      {user ? <dl className="mt-5 divide-y divide-stone-100 rounded-2xl border border-stone-200 px-4">
        <div className="grid grid-cols-[96px_1fr] gap-3 py-4 text-sm"><dt className="font-semibold text-stone-500">이름</dt><dd className="font-semibold text-stone-800">{user.name}</dd></div>
        <div className="grid grid-cols-[96px_1fr] gap-3 py-4 text-sm"><dt className="font-semibold text-stone-500">휴대폰 번호</dt><dd className="font-semibold text-stone-800">{formatMobileNumber(user.phone)}</dd></div>
        <div className="grid grid-cols-[96px_1fr] gap-3 py-4 text-sm"><dt className="font-semibold text-stone-500">이메일</dt><dd className="min-w-0 break-all font-semibold text-stone-800">{user.email}</dd></div>
      </dl> : <p className="mt-5 text-sm text-stone-500">{session.isLoading ? "계정 정보를 불러오는 중입니다." : "로그인 정보를 확인할 수 없습니다."}</p>}
      <Button variant="secondary" className="mt-6 w-full" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut className="size-4" />{logout.isPending ? "로그아웃하고 있어요" : "로그아웃"}</Button>
    </section>
    <section className="mt-5 rounded-[28px] border border-red-100 bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold text-red-700">회원탈퇴</h2><Button variant="danger" className="mt-5" onClick={() => setConfirmOpen(true)}><Trash2 className="size-4" />회원탈퇴</Button></section>
    <ConfirmDialog open={confirmOpen} title="정말 회원탈퇴할까요?" description="저장된 콘텐츠와 매장 정보가 모두 삭제되며 되돌릴 수 없습니다." confirmLabel={withdraw.isPending ? "처리 중" : "탈퇴하기"} onClose={() => setConfirmOpen(false)} onConfirm={() => withdraw.mutate()} />
    </div>
  </>;
}
