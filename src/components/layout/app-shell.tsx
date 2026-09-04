"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, BarChart3, ChevronDown, ChevronRight, Home, LayoutGrid, Store, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LegalFooter } from "@/components/common/legal-footer";
import { useToast } from "@/components/common/providers";
import { backendApi } from "@/lib/api/backend-api";

type NavItem = { href: string; label: string; icon: LucideIcon; special?: boolean; disabled?: boolean };
type UnsavedStoreChanges = { isDirty: boolean; sections: string[] };
const home: NavItem = { href: "/dashboard", label: "홈", icon: Home };
const contents: NavItem = { href: "/contents", label: "콘텐츠", icon: LayoutGrid };
const analytics: NavItem = { href: "/analytics", label: "성과", icon: BarChart3, disabled: true };
const desktopPrimary = [home, contents, analytics];
const desktopMore = [
  { href: "/settings/store", label: "매장 관리", icon: Store },
  { href: "/settings/social", label: "SNS 관리", icon: AtSign },
  { href: "/settings/account", label: "계정 관리", icon: UserRound },
];
const mobilePrimary: NavItem[] = [home, contents, ...desktopMore];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeStoreId, setActiveStoreId] = useState("");
  const [unsavedStoreChanges, setUnsavedStoreChanges] = useState<UnsavedStoreChanges>({ isDirty: false, sections: [] });
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
        {desktopMore.map(({ href, label, icon: Icon }) => {
          const selected = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={(event) => preventLeavingWithUnsavedStoreChanges(event, href)}
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
  </div>;
}
