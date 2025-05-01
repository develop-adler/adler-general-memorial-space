"use client";

import dynamic from "next/dynamic";

import { useResponsive } from "@/hooks/useResponsive";

const DesktopPostPage = dynamic(() => import("./index.desktop"), {
  ssr: false,
});
const MobilePostPage = dynamic(() => import("./index.mobileTab"), {
  ssr: false,
});
export const PostPage: React.FC = () => {
  const isMobile = useResponsive("Phone");
  const isTablet = useResponsive("Tablet");

  return <>{isMobile || isTablet ? <MobilePostPage /> : <DesktopPostPage />}</>;
};
