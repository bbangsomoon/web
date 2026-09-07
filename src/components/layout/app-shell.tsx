"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, BarChart3, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, CircleHelp, Home, LayoutGrid, LoaderCircle, Send, Store, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LegalFooter } from "@/components/common/legal-footer";
import { Button } from "@/components/common/ui";
import { useContentGeneration, useToast } from "@/components/common/providers";
import { backendApi } from "@/lib/api/backend-api";

type NavItem = { href: string; label: string; icon: LucideIcon; special?: boolean; disabled?: boolean; support?: boolean };
type UnsavedStoreChanges = { isDirty: boolean; sections: string[] };
const home: NavItem = { href: "/dashboard", label: "홈", icon: Home };
const contents: NavItem = { href: "/contents", label: "콘텐츠", icon: LayoutGrid };
const analytics: NavItem = { href: "/analytics", label: "성과", icon: BarChart3, disabled: true };
const desktopPrimary = [home, contents, analytics];
const desktopMore: NavItem[] = [
  { href: "/settings/store", label: "매장 관리", icon: Store },
  { href: "/settings/social", label: "SNS 관리", icon: AtSign },
  { href: "/settings/account", label: "계정 관리", icon: UserRound },
  { href: "#customer-support", label: "고객센터", icon: CircleHelp, support: true },
];
const mobilePrimary: NavItem[] = [home, contents, ...desktopMore.filter((item) => !item.support)];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { generationJob, clearGeneration } = useContentGeneration();
  const [activeStoreId, setActiveStoreId] = useState("");
  const [unsavedStoreChanges, setUnsavedStoreChanges] = useState<UnsavedStoreChanges>({ isDirty: false, sections: [] });
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTitle, setSupportTitle] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const stores = useQuery({ queryKey: ["stores"], queryFn: backendApi.getStores });
  useEffect(() => {
    if (!stores.isSuccess || stores.data.length > 0 || pathname === "/signup/store") return;
    router.replace("/signup/store");
  }, [pathname, router, stores.data, stores.isSuccess]);
  useEffect(() => {
    const updateUnsavedStoreChanges = (event: Event) => {
      setUnsavedStoreChanges((event as CustomEvent<UnsavedStoreChanges>).detail ?? { isDirty: false, sections: [] });
    };
    window.addEventListener("bbangsomoon:store-settings-dirty", updateUnsavedStoreChanges);
    return () => window.removeEventListener("bbangsomoon:store-settings-dirty", updateUnsavedStoreChanges);
  }, []);
  useEffect(() => {
    if (!supportOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSupportOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [supportOpen]);
  const selectedStoreId = activeStoreId && stores.data?.some((store) => store.id === activeStoreId) ? activeStoreId : stores.data?.[0]?.id ?? "";
  const currentStore = useQuery({ queryKey: ["store", selectedStoreId], queryFn: () => backendApi.getStore(selectedStoreId), enabled: Boolean(selectedStoreId) });
  const switchStore = useMutation({
    mutationFn: async (id: string) => {
      const store = await backendApi.getStore(id);
      localStorage.setItem("bbangsomoon.active-store", id);
      window.dispatchEvent(new Event("bbangsomoon:store-change"));
      return store;
    },
    onSuccess: (store) => {
      setActiveStoreId(store.id);
      queryClient.setQueryData(["store", store.id], store);
      queryClient.invalidateQueries({ queryKey: ["social"] });
      toast(`${store.name}(으)로 전환했어요.`, "info");
    },
  });
  const supportInquiry = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const account = await backendApi.getAccount();
      return backendApi.submitInquiry({ email: account.email, title, content });
    },
    onSuccess: () => {
      setSupportTitle("");
      setSupportMessage("");
      setSupportOpen(false);
      toast("문의가 접수됐어요.");
    },
  });
  const active = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    if (href === "/contents") return pathname.startsWith("/contents") && !pathname.startsWith("/contents/new");
    return pathname.startsWith(href);
  };
  const unsavedChangesMessage = () => `${unsavedStoreChanges.sections.join(" · ") || "매장 관리"}에 수정한 내용이 있어요. 저장한 뒤 이동해 주세요.`;
  const preventLeavingWithUnsavedStoreChanges = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== "/settings/store" || !unsavedStoreChanges.isDirty || href === pathname) return false;
    event.preventDefault();
    toast(unsavedChangesMessage(), "info");
    window.dispatchEvent(new Event("bbangsomoon:store-settings-focus-first-dirty"));
    return true;
  };
  const requestStoreChange = (storeId: string) => {
    if (pathname === "/settings/store" && unsavedStoreChanges.isDirty && storeId !== selectedStoreId) {
      toast(unsavedChangesMessage(), "info");
      window.dispatchEvent(new Event("bbangsomoon:store-settings-focus-first-dirty"));
      return;
    }
    switchStore.mutate(storeId);
  };
  return <div className="min-h-screen">
    {!pathname.startsWith("/contents/new") && generationJob?.status === "generating" && <div role="status" aria-live="polite" className="fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[60] inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-200 bg-[#fffaf5] px-4 text-sm font-bold text-[#b9471f] shadow-[0_10px_28px_rgba(92,70,53,.16)] sm:right-6 lg:right-8"><LoaderCircle className="size-4 animate-spin" />AI 콘텐츠 생성 중</div>}
    {!pathname.startsWith("/contents/new") && generationJob?.status === "completed" && generationJob.contentId && <Link href={`/contents/${generationJob.contentId}/edit?flow=generate${generationJob.thumbnailRequested ? "&thumbnail=1" : ""}`} onClick={clearGeneration} className="focus-ring fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[60] inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 shadow-[0_10px_28px_rgba(92,70,53,.16)] sm:right-6 lg:right-8"><CheckCircle2 className="size-4" />콘텐츠 생성 완료<ChevronRight className="size-4" /></Link>}
    {!pathname.startsWith("/contents/new") && generationJob?.status === "failed" && generationJob.contentId && <Link href={`/contents/${generationJob.contentId}`} onClick={clearGeneration} className="focus-ring fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[60] inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 shadow-[0_10px_28px_rgba(92,70,53,.16)] sm:right-6 lg:right-8"><CircleAlert className="size-4" />콘텐츠 생성 실패<ChevronRight className="size-4" /></Link>}
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] overflow-y-auto border-r border-stone-200 bg-[#26231f] p-6 text-white lg:flex lg:flex-col">
      <Link href="/dashboard" className="focus-ring block w-full shrink-0 rounded-xl py-1.5 text-center text-[22px] font-semibold tracking-[-.05em] text-white">빵소문</Link>
      <div className="relative mt-5 shrink-0">
        <select aria-label="관리할 매장 선택" value={currentStore.data?.id ?? ""} onChange={(event) => requestStoreChange(event.target.value)} disabled={stores.isLoading || currentStore.isLoading || switchStore.isPending} className="focus-ring min-h-12 w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 pr-10 text-sm font-semibold text-white transition hover:bg-[#39342f] disabled:opacity-60">
          {!currentStore.data && <option value="">매장을 불러오는 중</option>}
          {stores.data?.map((store) => <option key={store.id} value={store.id} className="bg-[#26231f] text-white">{store.name}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-white/70" />
      </div>
      <nav className="mt-7 shrink-0 space-y-1">
        {desktopPrimary.map(({ href, label, icon: Icon, special, disabled }) => {
          const selected = !disabled && active(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={(event) => {
                if (disabled) { event.preventDefault(); toast("성과 기능은 준비 중이에요.", "info"); return; }
                preventLeavingWithUnsavedStoreChanges(event, href);
              }}
              aria-disabled={disabled || undefined}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition",
                selected ? "bg-white text-stone-900 shadow-sm" : "text-white hover:bg-[#39342f]",
                special && "mt-3 bg-[#ef6b32]! text-white! hover:bg-[#d95320]!",
              )}
            >
              <Icon className="size-[19px]" />
              {label}
              {selected ? <ChevronRight className="ml-auto size-4" aria-hidden /> : special ? <span className="ml-auto text-xs opacity-75">AI</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 shrink-0 space-y-1 border-t border-white/20 pt-4">
        {desktopMore.map(({ href, label, icon: Icon, support }) => {
          const selected = !support && pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={(event) => {
                if (support) { event.preventDefault(); setSupportOpen(true); return; }
                preventLeavingWithUnsavedStoreChanges(event, href);
              }}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition",
                selected ? "bg-white text-stone-900 shadow-sm" : "text-white hover:bg-[#39342f]",
              )}
            >
              <Icon className="size-[18px]" />
              {label}
              {selected && <ChevronRight className="ml-auto size-4" aria-hidden />}
            </Link>
          );
        })}
      </div>
      <LegalFooter dark className="mt-auto shrink-0 border-t pt-5"/>
    </aside>
    <div className="app-content min-h-screen pb-24 lg:pb-0"><div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">{children}</div></div>
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid h-[76px] grid-cols-5 border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">{mobilePrimary.map(({href,label,icon:Icon})=>{const selected=active(href);return <Link key={href} href={href} onClick={(event) => preventLeavingWithUnsavedStoreChanges(event, href)} aria-current={selected ? "page" : undefined} className={cn("focus-ring flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors hover:bg-orange-50/70 hover:text-[#ef6b32]",selected?"text-[#ef6b32]":"text-stone-500")}><span className="grid size-8 place-items-center rounded-xl transition-colors"><Icon className="size-5"/></span><span>{label}</span></Link>})}</nav>
    {supportOpen && <div className="fixed inset-0 z-[110] grid place-items-end bg-black/35 p-4 sm:place-items-center" onMouseDown={() => setSupportOpen(false)}>
      <form role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); const title = supportTitle.trim(); const content = supportMessage.trim(); if (title && content) supportInquiry.mutate({ title, content }); }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="support-title" className="text-xl font-black">고객센터</h2><p className="mt-2 text-sm leading-6 text-stone-500">문의 내용을 남겨 주시면 운영팀에 전달할게요.</p></div><button type="button" onClick={() => setSupportOpen(false)} aria-label="고객센터 닫기" className="focus-ring grid size-9 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="size-5" /></button></div>
        <label className="mt-6 block"><span className="mb-2 block text-sm font-bold">문의 제목 <b className="text-[#ef6b32]">*</b></span><input value={supportTitle} onChange={(event) => setSupportTitle(event.target.value)} maxLength={100} className="field" placeholder="문의 제목을 입력해 주세요." autoFocus /></label>
        <label className="mt-5 block"><span className="mb-2 block text-sm font-bold">문의 내용 <b className="text-[#ef6b32]">*</b></span><textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} maxLength={2_000} rows={7} className="field resize-none leading-6" placeholder="문의 내용을 자세히 적어 주세요." /></label>
        <p className="mt-2 text-right text-xs font-semibold text-stone-400">{supportMessage.length.toLocaleString()} / 2,000자</p>
        <Button type="submit" disabled={!supportTitle.trim() || !supportMessage.trim() || supportInquiry.isPending} className="mt-5 min-h-12 w-full">{supportInquiry.isPending ? "문의 접수 중" : <><Send className="size-4" />문의하기</>}</Button>
      </form>
    </div>}
  </div>;
}
