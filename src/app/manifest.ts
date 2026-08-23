import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "빵소문 — AI SNS 마케팅",
    short_name: "빵소문",
    description: "오늘 만든 빵, 동네에 소문내세요.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#ef6b32",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
