"use client";
import { useState, useEffect } from 'react';

import { isMobile, isSafari as isSafariUtil } from '@/utils/browserUtils';

type DetectBrowserProps = {
  isWebView: boolean;
  isAndroidWebView: boolean;
  isIOSWebView: boolean;
  isSafariPC: boolean;
  isEdgePC: boolean;
  isAppleDevice: boolean;
  isMobileBrowser: boolean;
  isIOSMobile: boolean;
  isIOSBrowser: boolean;
  isAndroidBrowser: boolean;
};

export const useDetectBrowser = (): DetectBrowserProps => {
  const [isWebView, setIsWebView] = useState<boolean>(false);
  const [isAndroidWebView, setIsAndroidWebView] = useState<boolean>(false);
  const [isIOSWebView, setIsIOSWebView] = useState<boolean>(false);
  const [isSafariPC, setIsSafariPC] = useState<boolean>(false);
  const [isEdgePC, setIsEdgePC] = useState<boolean>(false);
  const [isAppleDevice, setIsAppleDevice] = useState<boolean>(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState<boolean>(false);
  const [isIOSMobile, setIsIOSMobile] = useState<boolean>(false);
  const [isIOSBrowser, setIsIOSBrowser] = useState<boolean>(false);
  const [isAndroidBrowser, setIsAndroidBrowser] = useState<boolean>(false);

  const handleDetectBrowser = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigator = window.navigator as any;
    const userAgent = navigator.userAgent;
    const normalizedUserAgent = userAgent.toLowerCase();
    const standalone = navigator.standalone;
    const isIos =
      /ip(ad|hone|od)/.test(normalizedUserAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(normalizedUserAgent);
    const vendor = navigator.vendor;
    const isSafari =
      (isSafariUtil() && isIos) ||
      (/Safari/i.test(userAgent) &&
        /Apple Computer/.test(vendor) &&
        !/Mobi|Android/i.test(userAgent));
    const isWV =
      (isAndroid && /; wv\)/.test(normalizedUserAgent)) || (isIos && !standalone && !isSafari);
    const isEdge = userAgent.indexOf('edg') > -1;
    setIsAppleDevice(/ip(ad|hone|od)/.test(normalizedUserAgent))

    if (isIos) {
      if (isWV) {
        setIsIOSWebView(true);
        setIsWebView(true);
      }
    } else if (isSafari) {
      setIsSafariPC(true);
    } else if (isEdge) {
      setIsEdgePC(true);
    } else if (isAndroid && isWV) {
      setIsAndroidWebView(true);
      setIsWebView(true);
    }
    if ((isIos || isAndroid) && !isWV) {
      setIsMobileBrowser(true);
    }
    if (isAndroid && !isWV) {
      setIsAndroidBrowser(true);
    }
    if (isIos && !isWV) {
      setIsIOSBrowser(true);
    }
    if (isIos && isMobile()) {
      setIsIOSMobile(true);
    }
  };

  useEffect(() => {
    handleDetectBrowser();
    return () => {
      setIsWebView(false);
    };
  }, []);

  return { 
    isEdgePC, 
    isIOSBrowser, 
    isAndroidBrowser,  
    isSafariPC, 
    isWebView, 
    isAndroidWebView, 
    isIOSWebView, 
    isAppleDevice, 
    isMobileBrowser, 
    isIOSMobile 
  };
};
