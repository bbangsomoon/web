import Link from "next/link";
import { Logo } from "@/components/common/ui";
import { LegalFooter } from "@/components/common/legal-footer";
import { LegalDocument, legalDocumentTitle, type LegalDocumentType } from "@/components/common/legal-document";

export function LegalPage({ type }: { type: LegalDocumentType }) {
  return <main className="min-h-screen bg-[#fbfaf6] px-5 py-6 sm:px-10 lg:px-14"><header className="mx-auto flex max-w-3xl items-center justify-between gap-4"><Logo href="/" /><Link href="/" className="focus-ring rounded-lg text-sm font-semibold text-stone-500 hover:text-stone-800">홈으로</Link></header><article className="mx-auto mt-12 max-w-3xl rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_12px_30px_rgba(55,40,25,.05)] sm:p-9"><h1 className="text-2xl font-black tracking-[-.04em] text-stone-900 sm:text-3xl">{legalDocumentTitle[type]}</h1><p className="mt-3 text-sm text-stone-500">v1.0 · 시행일: 2026년 9월 8일{type === "privacy" ? " · 최종 수정일: 2026년 9월 8일" : ""}</p><div className="mt-8 border-t border-stone-200 pt-8"><LegalDocument type={type} /></div></article><LegalFooter className="mx-auto mt-8 max-w-3xl border-t pt-5" /></main>;
}
