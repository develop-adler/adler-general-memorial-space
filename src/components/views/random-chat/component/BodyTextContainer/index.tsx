"use client";

import dynamic from "next/dynamic";

import { useResponsive } from "@/hooks/useResponsive";

const DesktopBodyTextContainer = dynamic(() => import("./index.desktop"), {
  ssr: false,
});
const MobileBodyTextContainer = dynamic(() => import("./index.mobileTab"), {
  ssr: false,
});
export const BodyTextContainer: React.FC = () => {
  const isMobile = useResponsive("Phone");
  const isTablet = useResponsive("Tablet");

  return <>{isMobile || isTablet ? <MobileBodyTextContainer /> : <DesktopBodyTextContainer />}</>;
};