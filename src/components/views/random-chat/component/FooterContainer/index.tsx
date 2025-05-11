"use client";

import dynamic from "next/dynamic";

import { useResponsive } from "@/hooks/useResponsive";

const DesktopFooterContainer = dynamic(() => import("./index.desktop"), {
  ssr: false,
});
const MobileFooterContainer = dynamic(() => import("./index.mobileTab"), {
  ssr: false,
});
export const FooterContainer: React.FC = () => {
  const isMobile = useResponsive("Phone");
  const isTablet = useResponsive("Tablet");

  return <>{isMobile || isTablet ? <MobileFooterContainer /> : <DesktopFooterContainer />}</>;
};