"use client";

import dynamic from "next/dynamic";

import { useResponsive } from "@/hooks/useResponsive";

const DesktopRandomPage = dynamic(() => import("./index.desktop"), {
  ssr: false,
});
const MobileRandomPage = dynamic(() => import("./index.mobileTab"), {
  ssr: false,
});
export const RandomChat: React.FC = () => {
  const isMobile = useResponsive("Phone");
  const isTablet = useResponsive("Tablet");

  return <>{isMobile || isTablet ? <MobileRandomPage /> : <DesktopRandomPage />}</>;
};