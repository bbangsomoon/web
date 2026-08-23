import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarClock, Camera, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/common/ui";
import { LegalFooter } from "@/components/common/legal-footer";

const features = [
  { icon: Sparkles, step: "01", title: "AI 홍보 글 생성", text: "빵 사진과 이름만 넣으면 우리 매장 말투로 자연스러운 글을 써드려요." },
  { icon: CalendarClock, step: "02", title: "인스타그램 예약 게시", text: "손님이 많이 보는 시간에 맞춰 잊지 않고 게시할 수 있어요." },
  { icon: BarChart3, step: "03", title: "게시물 성과 확인", text: "어떤 빵을 손님들이 좋아했는지 쉬운 숫자로 바로 확인해요." },
];

export default function LandingPage() {
  return <main className="min-h-screen overflow-hidden bg-[#fbfaf6]">
    <header className="relative z-20 mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8">
      <Logo href="/"/><div className="flex items-center gap-2"><Link href="/login" className="focus-ring hidden min-h-11 items-center rounded-xl px-4 text-sm font-bold text-stone-600 hover:bg-orange-50 sm:flex">로그인</Link><Link href="/signup" className="focus-ring flex min-h-11 items-center rounded-xl bg-stone-900 px-4 text-sm font-bold text-white hover:bg-stone-700">무료로 시작하기</Link></div>
    </header>

    <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-2 sm:px-8 sm:pt-7 lg:pb-24">
      <div className="relative min-h-[650px] overflow-hidden rounded-[34px] bg-[#efe6d8] sm:min-h-[680px] lg:min-h-[610px]">
        <Image src="/images/bakery-hero.png" alt="따뜻한 햇살 아래 정성스럽게 구운 빵" fill priority sizes="(max-width: 1024px) 100vw, 1200px" className="object-cover object-[66%_center] lg:object-center"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b1b12]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#f5eee4] lg:via-[#f5eee4]/90 lg:to-transparent"/>
        <div className="absolute inset-x-0 bottom-0 z-10 p-7 text-white sm:p-12 lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:w-[58%] lg:items-center lg:p-16 lg:text-stone-900">
          <div><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-extrabold text-[#d95320] shadow-sm backdrop-blur"><Sparkles className="size-4"/>사장님의 SNS 일을 가볍게</div>
            <h1 className="display-serif text-[42px] font-bold leading-[1.08] tracking-[-.055em] sm:text-[58px] lg:text-[68px]">오늘 만든 빵,<br/><span className="text-[#ef6b32]">동네에 소문</span>내세요.</h1>
            <p className="mt-6 max-w-lg text-[16px] font-medium leading-7 text-white/85 lg:text-[18px] lg:leading-8 lg:text-stone-600">사진 한 장과 간단한 정보면 충분해요. 빵소문이 인스타그램 글부터 게시 시간까지 차근차근 챙겨드릴게요.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#ef6b32] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(198,72,20,.3)] hover:bg-[#d95320]">무료로 시작하기 <ArrowRight className="size-5"/></Link><a href="#how" className="focus-ring inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/40 bg-white/15 px-6 text-base font-bold backdrop-blur hover:bg-orange-100/30 lg:border-stone-300 lg:bg-white/80 lg:text-stone-700">어떻게 쓰나요?</a></div>
            <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/75 lg:text-stone-500"><Check className="size-4 text-[#ef6b32]"/>카드 등록 없이 바로 체험해 보세요</p>
          </div>
        </div>
      </div>
    </section>

    <section id="how" className="bg-white px-5 py-20 sm:px-8 lg:py-28"><div className="mx-auto max-w-[1120px]"><div className="text-center"><span className="text-sm font-black text-[#ef6b32]">빵소문으로 달라지는 하루</span><h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">어려운 마케팅, 세 걸음이면 끝</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">메뉴가 많아 복잡한 관리 도구 대신, 지금 필요한 일만 크게 보여드려요.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">{features.map(({icon:Icon,step,title,text})=><article key={title} className="group relative overflow-hidden rounded-[28px] border border-stone-200 bg-[#fbfaf6] p-7 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/5"><span className="absolute right-6 top-5 display-serif text-4xl font-bold text-stone-200">{step}</span><div className="grid size-13 place-items-center rounded-2xl bg-orange-100 text-[#d95320]"><Icon className="size-6"/></div><h3 className="mt-7 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-stone-500">{text}</p></article>)}</div></div></section>

    <section className="px-5 py-20 sm:px-8"><div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-8 overflow-hidden rounded-[32px] bg-[#28241f] p-8 text-center text-white sm:p-12 lg:flex-row lg:text-left"><div><div className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-orange-300"><Camera className="size-5"/>동네 빵집 사장님을 위해</div><h2 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">빵 굽는 일에 더 집중하세요.</h2><p className="mt-3 text-stone-400">소문내는 일은 빵소문이 도울게요.</p></div><Link href="/signup" className="focus-ring inline-flex min-h-14 shrink-0 items-center gap-2 rounded-2xl bg-[#ef6b32] px-7 font-black hover:bg-[#d95320]">지금 시작하기 <ArrowRight className="size-5"/></Link></div></section>
    <LegalFooter className="border-t px-5 py-8"/>
  </main>;
}
