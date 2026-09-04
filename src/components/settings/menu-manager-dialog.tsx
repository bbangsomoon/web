"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/common/ui";
import { cn } from "@/lib/utils";
import type { StoreMenu } from "@/types";

type MenuDraft = Omit<StoreMenu, "id" | "price"> & { price: string };

const MAX_MENU_DESCRIPTION_LENGTH = 100;
const MIN_MENU_PRICE = 100;
const MAX_MENU_PRICE = 1_000_000;

const emptyDraft: MenuDraft = {
  category: "",
  name: "",
  price: "",
  description: "",
  imageUrl: "/images/bakery-hero.png",
  soldOut: false,
};

export function MenuManagerDialog({
  open,
  menus,
  onClose,
  onApply,
}: {
  open: boolean;
  menus: StoreMenu[];
  onClose: () => void;
  onApply: (menus: StoreMenu[]) => void;
}) {
  if (!open) return null;
  return <MenuManagerDialogContent menus={menus} onClose={onClose} onApply={onApply} />;
}

function MenuManagerDialogContent({
  menus,
  onClose,
  onApply,
}: {
  menus: StoreMenu[];
  onClose: () => void;
  onApply: (menus: StoreMenu[]) => void;
}) {
  const [draftMenus, setDraftMenus] = useState<StoreMenu[]>(menus);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
  };

  const startEdit = (menu: StoreMenu) => {
    setEditingId(menu.id);
    setDraft({ ...menu, price: String(menu.price) });
    setError("");
  };

  const saveMenu = () => {
    const price = Number(draft.price.replaceAll(",", ""));
    if (!draft.name.trim()) {
      setError("메뉴 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(price) || price < MIN_MENU_PRICE || price > MAX_MENU_PRICE) {
      setError("가격은 100원부터 1,000,000원까지 입력할 수 있어요.");
      return;
    }
    if (draft.description.trim().length > MAX_MENU_DESCRIPTION_LENGTH) {
      setError(`메뉴 설명은 ${MAX_MENU_DESCRIPTION_LENGTH}자까지 입력할 수 있어요.`);
      return;
    }
    const next: StoreMenu = {
      id: editingId ?? `menu-${Date.now()}`,
      category: draft.category.trim(),
      name: draft.name.trim(),
      price,
      description: draft.description.trim(),
      imageUrl: draft.imageUrl,
      soldOut: draft.soldOut,
    };
    setDraftMenus((current) => editingId
      ? current.map((menu) => menu.id === editingId ? next : menu)
      : [...current, next]);
    startNew();
  };

  const addImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("5MB 이하의 JPG, PNG 또는 WebP 사진을 선택해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, imageUrl: String(reader.result) }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-5" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-manager-title"
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-[#fbfaf6] shadow-2xl sm:max-h-[88dvh] sm:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <h2 id="menu-manager-title" className="text-xl font-black">메뉴 관리</h2>
            <p className="mt-1 text-sm text-stone-500">메뉴를 여러 개 등록하고 수정할 수 있어요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="메뉴 관리 닫기" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900">
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.05fr_.95fr] lg:overflow-hidden">
          <div className="border-b border-stone-200 p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-7">
            <p className="mb-4 text-sm font-black">등록된 메뉴 <span className="text-[#ef6b32]">{draftMenus.length}</span></p>
            {draftMenus.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-stone-300 bg-white text-center">
                <div><p className="font-bold">등록된 메뉴가 없어요.</p><p className="mt-1 text-sm text-stone-500">오른쪽 입력란에서 첫 메뉴를 추가해 주세요.</p></div>
              </div>
            ) : (
              <ul className="space-y-2">
                {draftMenus.map((menu) => (
                  <li key={menu.id} className={cn("flex items-center gap-3 rounded-2xl border bg-white p-3 transition", editingId === menu.id ? "border-[#ef6b32] ring-2 ring-orange-100" : "border-stone-200")}>
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      <Image src={menu.imageUrl || "/images/bakery-hero.png"} alt={`${menu.name} 메뉴 사진`} fill sizes="64px" unoptimized={menu.imageUrl.startsWith("data:")} className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{menu.name}</span>
                      <p className="mt-1 truncate text-xs text-stone-500">{menu.price.toLocaleString("ko-KR")}원</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => startEdit(menu)} aria-label={`${menu.name} 수정`} className="focus-ring grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-orange-50 hover:text-[#d95320]"><Pencil className="size-4" /></button>
                      <button type="button" onClick={() => { setDraftMenus((current) => current.filter((item) => item.id !== menu.id)); if (editingId === menu.id) startNew(); }} aria-label={`${menu.name} 삭제`} className="focus-ring grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-5 lg:overflow-y-auto lg:p-7">
            <h3 className="text-lg font-black">{editingId ? "메뉴 수정" : "새 메뉴 추가"}</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <span className="mb-2 block text-sm font-bold">메뉴 사진</span>
                <div className="flex items-center gap-4">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                    <Image src={draft.imageUrl} alt="메뉴 사진 미리보기" fill sizes="96px" unoptimized={draft.imageUrl.startsWith("data:")} className="object-cover" />
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { addImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50">
                    <ImagePlus className="size-4" />사진 변경
                  </button>
                </div>
              </div>
              <label><span className="mb-2 block text-sm font-bold">메뉴 이름 <b className="text-[#ef6b32]">*</b></span><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="field" placeholder="예: 소금빵" /></label>
              <label><span className="mb-2 block text-sm font-bold">가격 <b className="text-[#ef6b32]">*</b></span><div className="relative"><input value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value.replace(/\D/g, "").slice(0, 7) }))} inputMode="numeric" maxLength={7} className="field pr-11" placeholder="3000" /><span className="absolute right-4 top-3.5 text-sm text-stone-400">원</span></div><span className="mt-1.5 block text-xs text-stone-500">100원~1,000,000원</span></label>
              <label className="sm:col-span-2 lg:col-span-1 xl:col-span-2"><span className="mb-2 flex items-center justify-between text-sm font-bold"><span>메뉴 설명</span><span className="text-xs font-medium text-stone-400">{draft.description.length}/{MAX_MENU_DESCRIPTION_LENGTH}</span></span><textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value.slice(0, MAX_MENU_DESCRIPTION_LENGTH) }))} maxLength={MAX_MENU_DESCRIPTION_LENGTH} rows={3} className="field resize-none" placeholder="맛과 재료를 간단히 알려주세요." /></label>
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
            <Button type="button" onClick={saveMenu} className="mt-5 w-full">{editingId ? "메뉴 수정 완료" : "메뉴 추가"}</Button>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-stone-200 bg-white p-4 sm:justify-end sm:px-7">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">취소</Button>
          <Button type="button" onClick={() => { onApply(draftMenus); onClose(); }} className="flex-1 sm:min-w-32 sm:flex-none">변경 적용</Button>
        </footer>
      </section>
    </div>
  );
}
