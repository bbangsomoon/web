import { NextRequest, NextResponse } from "next/server";

type KakaoAddress = { x?: string; y?: string };
type KakaoPlace = { address?: KakaoAddress; road_address?: KakaoAddress };

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();
  if (!address) return NextResponse.json({ message: "주소를 입력해 주세요." }, { status: 400 });
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return NextResponse.json({ message: "주소 좌표 변환 설정이 필요합니다." }, { status: 503 });

  const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ message: "주소 좌표를 찾지 못했어요." }, { status: 502 });
  const payload = await response.json() as { documents?: KakaoPlace[] };
  const location = payload.documents?.[0]?.road_address ?? payload.documents?.[0]?.address;
  const longitude = Number(location?.x); const latitude = Number(location?.y);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ message: "주소 좌표를 찾지 못했어요." }, { status: 404 });
  return NextResponse.json({ latitude, longitude });
}
