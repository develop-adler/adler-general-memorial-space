"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";

import { useResponsive } from "@/hooks/useResponsive";
import { useDetectBrowser } from "@/hooks/useDetectBrowser";


const DesktopRandomPage = dynamic(() => import("./index.desktop"), {
  ssr: false,
});
const MobileRandomPage = dynamic(() => import("./index.mobileTab"), {
  ssr: false,
});
export const RandomChat: React.FC = () => {
  const isMobile = useResponsive("Phone");
  const isTablet = useResponsive("Tablet");
  const { isIOSWebView } = useDetectBrowser();

  useEffect(() => {
    if (isIOSWebView) {
      document.documentElement.classList.add('wkwebview-ios');
    } else {
      document.documentElement.classList.remove('wkwebview-ios');
    }
  }, [isIOSWebView]);

  return <>{isMobile || isTablet ? <MobileRandomPage /> : <DesktopRandomPage />}</>;
};