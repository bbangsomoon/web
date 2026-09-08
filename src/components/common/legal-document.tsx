import type { ReactNode } from "react";

export type LegalDocumentType = "privacy" | "terms";

export const legalDocumentTitle: Record<LegalDocumentType, string> = {
  privacy: "개인정보처리방침",
  terms: "서비스 이용약관",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-9 first:mt-0"><h2 className="text-base font-black text-stone-900 sm:text-lg">{title}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-stone-600">{children}</div></section>;
}

const listClass = "list-disc space-y-1 pl-5 marker:text-stone-400";

function PrivacyPolicy() {
  return <>
    <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-6 text-stone-700">빵소문은 개인정보 보호법 등 관련 법령을 준수하며, 서비스 이용에 필요한 범위에서 개인정보를 처리합니다.</p>

    <Section title="1. 개인정보의 처리 목적">
      <p>빵소문은 회원 식별과 계정 관리, 매장 정보 및 콘텐츠 관리, SNS 연동·게시, 고객 문의 응대, 서비스 안정성 확보를 위해 개인정보를 처리합니다.</p>
    </Section>

    <Section title="2. 처리하는 개인정보 항목">
      <div className="overflow-x-auto rounded-2xl border border-stone-200"><table className="min-w-[620px] w-full text-left text-xs leading-5"><thead className="bg-stone-50 text-stone-600"><tr><th className="px-4 py-3 font-bold">처리 목적</th><th className="px-4 py-3 font-bold">항목</th><th className="px-4 py-3 font-bold">보유 기간</th></tr></thead><tbody className="divide-y divide-stone-200 text-stone-600"><tr><td className="px-4 py-3 font-semibold text-stone-700">회원가입·로그인</td><td className="px-4 py-3">이름, 이메일 주소, 휴대폰 번호, 비밀번호(암호화 처리)</td><td className="px-4 py-3">회원 탈퇴 시까지</td></tr><tr><td className="px-4 py-3 font-semibold text-stone-700">매장 관리</td><td className="px-4 py-3">매장명, 주소, 전화번호, 대표자명, 사업자등록번호, 메뉴·영업 정보</td><td className="px-4 py-3">회원 탈퇴 또는 매장 삭제 시까지</td></tr><tr><td className="px-4 py-3 font-semibold text-stone-700">SNS 연동·콘텐츠</td><td className="px-4 py-3">연결 플랫폼 계정 식별 정보, 공개 프로필 정보, 연동 토큰, 업로드 미디어·게시 정보</td><td className="px-4 py-3">연동 해제 또는 회원 탈퇴 시까지</td></tr><tr><td className="px-4 py-3 font-semibold text-stone-700">고객 문의</td><td className="px-4 py-3">이메일 주소, 문의 제목·내용, 문의 처리 이력</td><td className="px-4 py-3">문의 처리 완료 후 3년</td></tr><tr><td className="px-4 py-3 font-semibold text-stone-700">서비스 이용</td><td className="px-4 py-3">접속 일시, IP 주소, 서비스 이용 기록, 쿠키·기기 정보</td><td className="px-4 py-3">서비스 안정성 확보에 필요한 기간</td></tr></tbody></table></div>
    </Section>

    <Section title="3. 개인정보의 수집 방법">
      <ul className={listClass}><li>회원가입, 매장 등록·관리, 고객센터 문의 등 이용자가 직접 입력하는 정보</li><li>서비스 이용 과정에서 자동 생성되는 접속 기록 및 쿠키 정보</li><li>이용자가 동의해 연결한 SNS 플랫폼이 제공하는 계정·게시 관련 정보</li></ul>
    </Section>

    <Section title="4. 개인정보의 제3자 제공 및 처리위탁">
      <p>빵소문은 원칙적으로 이용자 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만 서비스 운영에 필요한 범위에서 클라우드 인프라·미디어 저장소, 이메일 발송, SNS 연동 사업자에게 처리를 위탁하거나 관련 정보를 전송할 수 있습니다.</p>
      <ul className={listClass}><li>미디어 저장 및 인프라: Amazon Web Services</li><li>이메일 발송: Resend</li><li>SNS 연동·게시: Meta(Instagram)</li></ul>
      <p>위탁 또는 국외 이전의 내용이 변경되면 관련 법령에 따라 본 방침 또는 서비스 내 공지로 알립니다.</p>
    </Section>

    <Section title="5. 개인정보의 파기">
      <p>보유 기간이 끝나거나 처리 목적이 달성되면 지체 없이 파기합니다. 전자 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각합니다. 법령에 따라 보관이 필요한 정보는 해당 기간 동안 별도로 안전하게 보관합니다.</p>
    </Section>

    <Section title="6. 이용자의 권리와 행사 방법">
      <p>이용자는 자신의 개인정보에 대해 열람, 정정·삭제, 처리 정지, 동의 철회를 요청할 수 있습니다. 계정 관리 또는 고객센터를 통해 요청할 수 있으며, 빵소문은 관련 법령에 따라 처리합니다.</p>
    </Section>

    <Section title="7. 개인정보 보호를 위한 조치">
      <p>빵소문은 접근 권한 관리, 비밀번호 암호화, 전송 구간 보호, 접근 기록 관리 등 개인정보 보호를 위한 기술적·관리적 조치를 적용합니다.</p>
    </Section>

    <Section title="8. 쿠키의 이용">
      <p>빵소문은 로그인 상태 유지와 서비스 안정성 확보를 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 기능의 이용이 제한될 수 있습니다.</p>
    </Section>

    <Section title="9. 개인정보 보호책임자 및 문의">
      <ul className={listClass}><li>개인정보 보호책임자: 빵소문 운영팀</li><li>이메일: bbangsomoon@gmail.com</li></ul>
      <p>개인정보 침해에 관한 상담·신고는 개인정보침해 신고센터(privacy.kisa.or.kr), 개인정보분쟁조정위원회(kopico.go.kr) 등 관계 기관을 이용할 수 있습니다.</p>
    </Section>

    <Section title="10. 방침의 변경">
      <p>본 방침은 법령, 서비스 또는 보안 정책의 변경에 따라 개정될 수 있습니다. 중요한 변경 사항은 시행일 7일 전부터 서비스 내 공지합니다.</p>
    </Section>
  </>;
}

function ServiceTerms() {
  return <>
    <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-6 text-stone-700">본 약관은 빵소문이 제공하는 AI 기반 SNS 마케팅 서비스의 이용 조건과 회원 및 빵소문의 권리·의무를 정합니다.</p>

    <Section title="제1조 목적">
      <p>본 약관은 빵소문(이하 “회사”)이 제공하는 매장 정보 관리, AI 콘텐츠 생성, SNS 연동 및 게시 관련 서비스(이하 “서비스”)의 이용과 관련한 조건 및 절차를 정함을 목적으로 합니다.</p>
    </Section>

    <Section title="제2조 용어의 정의">
      <ul className={listClass}><li>“회원”은 본 약관에 동의하고 계정을 생성해 서비스를 이용하는 사람을 말합니다.</li><li>“매장 정보”는 회원이 등록하는 매장명, 주소, 메뉴, 영업시간 등 매장 운영 정보를 말합니다.</li><li>“콘텐츠”는 회원이 업로드하거나 AI를 통해 생성·수정·게시하는 사진, 문구, 해시태그 등 SNS 게시물을 말합니다.</li></ul>
    </Section>

    <Section title="제3조 약관의 게시와 변경">
      <p>회사는 본 약관을 서비스 화면에 게시합니다. 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 중요한 변경 사항은 시행일 7일 전부터 공지합니다. 회원에게 불리한 변경은 합리적인 방법으로 별도 안내합니다.</p>
    </Section>

    <Section title="제4조 회원가입과 계정 관리">
      <ul className={listClass}><li>회원은 정확한 정보를 입력해야 하며, 타인의 정보를 사용하거나 허위 정보를 등록해서는 안 됩니다.</li><li>회원은 계정과 비밀번호를 안전하게 관리해야 하며, 제3자에게 양도·대여·공유할 수 없습니다.</li><li>회원은 언제든지 계정 관리 메뉴를 통해 탈퇴를 요청할 수 있습니다.</li></ul>
    </Section>

    <Section title="제5조 서비스의 내용">
      <p>회사는 매장 정보 관리, AI 기반 콘텐츠 문구 생성, 콘텐츠 보관·수정, 연결된 SNS 플랫폼 게시 기능 등을 제공합니다. 서비스의 구체적인 제공 범위, 지원 플랫폼 및 기능은 운영 정책과 서비스 화면에 따라 달라질 수 있습니다.</p>
    </Section>

    <Section title="제6조 회원의 의무">
      <ul className={listClass}><li>회원은 등록하는 매장 정보와 콘텐츠가 정확하고 최신 상태가 되도록 관리해야 합니다.</li><li>회원은 법령, 제3자의 권리, SNS 플랫폼 정책을 위반하거나 타인에게 피해를 주는 콘텐츠를 등록·게시해서는 안 됩니다.</li><li>회원은 사진, 상표, 음악, 문구 등 콘텐츠에 필요한 권리를 보유하거나 적법한 이용 권한을 확보해야 합니다.</li><li>회원은 AI 생성 결과를 게시하기 전에 사실관계, 가격·행사 조건, 광고 표시, 권리 침해 여부를 직접 확인해야 합니다.</li></ul>
    </Section>

    <Section title="제7조 AI 생성 콘텐츠와 SNS 연동">
      <p>AI가 생성한 결과는 참고용 초안이며, 회사는 결과의 정확성·완전성·적합성을 보장하지 않습니다. 회원의 요청과 최종 게시 결정에 대한 책임은 회원에게 있습니다. SNS 연동 및 게시 기능은 각 플랫폼의 정책, API 상태, 계정 권한 또는 외부 장애에 따라 제한될 수 있습니다.</p>
    </Section>

    <Section title="제8조 콘텐츠의 권리와 이용">
      <p>회원이 등록한 콘텐츠의 권리는 원칙적으로 회원 또는 정당한 권리자에게 있습니다. 회원은 회사가 서비스 제공, 저장, 표시, SNS 게시 및 기능 개선을 위해 필요한 범위에서 콘텐츠를 처리하도록 허용합니다. 회사는 서비스 운영 목적 외의 용도로 회원 콘텐츠를 이용하지 않습니다.</p>
    </Section>

    <Section title="제9조 서비스의 변경·중단">
      <p>회사는 운영·기술·보안상 필요한 경우 서비스 전부 또는 일부를 변경하거나 중단할 수 있습니다. 회원의 권리에 중대한 영향을 주는 변경·중단은 가능한 한 사전에 알립니다. 천재지변, 외부 플랫폼 장애 등 불가피한 사유가 있는 경우 사후에 알릴 수 있습니다.</p>
    </Section>

    <Section title="제10조 이용 제한과 계약 해지">
      <p>회사는 회원이 본 약관 또는 관련 법령을 위반하거나 서비스의 안정적 운영을 방해하는 경우, 사전 통지 후 이용을 제한하거나 계약을 해지할 수 있습니다. 긴급한 보안·권리 침해 우려가 있는 경우에는 필요한 조치를 우선 취할 수 있습니다.</p>
    </Section>

    <Section title="제11조 책임의 제한">
      <p>회사는 고의 또는 중대한 과실이 없는 한 무료로 제공되는 서비스 이용 과정에서 발생한 손해에 대해 책임을 지지 않습니다. 회사는 회원이 등록·게시한 콘텐츠, 회원과 제3자 또는 SNS 플랫폼 사이의 분쟁에 관여하지 않으며, 관련 법령에 따른 책임이 있는 경우를 제외하고 책임을 부담하지 않습니다.</p>
    </Section>

    <Section title="제12조 준거법과 분쟁 해결">
      <p>본 약관은 대한민국 법령에 따라 해석됩니다. 서비스 이용과 관련해 분쟁이 발생하면 회사와 회원은 성실히 협의하며, 협의로 해결되지 않는 경우 민사소송법상 관할 법원에 제기할 수 있습니다.</p>
    </Section>

    <Section title="제13조 문의처">
      <p>서비스 및 약관에 관한 문의는 서비스 내 고객센터 또는 bbangsomoon@gmail.com으로 할 수 있습니다.</p>
    </Section>
  </>;
}

export function LegalDocument({ type }: { type: LegalDocumentType }) {
  return <div className="legal-document">{type === "privacy" ? <PrivacyPolicy /> : <ServiceTerms />}</div>;
}
