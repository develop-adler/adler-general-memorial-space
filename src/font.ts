// import { Inter } from "next/font/google";
import localFont from "next/font/local";

// export const ubuntuFontSetting = Ubuntu({
//   weight: ['300', '400', '500', '700'],
//   variable: '--ubuntu',
//   subsets: ['latin'],
// });

// export const interFontSetting = Inter({
//   weight: ['300', '400', '500', '700'],
//   variable: '--inter',
//   subsets: ['latin'],
// });

export const pretendardFontSetting = localFont({
  src: [
    // {
    //   path: '../public/static/fonts/Pretendard/Pretendard-Thin.woff2',
    //   weight: '100',
    // },
    // {
    //   path: '../public/static/fonts/Pretendard/Pretendard-ExtraLight.woff2',
    //   weight: '200',
    // },
    // {
    //   path: '../public/static/fonts/Pretendard/Pretendard-Light.woff2',
    //   weight: '300',
    // },
    {
      path: '../public/static/fonts/Pretendard/PretendardVariable.woff2',
      weight: '400',
    },
    {
      path: '../public/static/fonts/Pretendard/PretendardVariable.woff2',
      weight: '500',
    },
    // {
    //   path: '../public/static/fonts/Pretendard/Pretendard-SemiBold.woff2',
    //   weight: '600',
    // },
    {
      path: '../public/static/fonts/Pretendard/PretendardVariable.woff2',
      weight: '700',
    },
    {
      path: '../public/static/fonts/Pretendard/PretendardVariable.woff2',
      weight: '800',
    },
    // {
    //   path: '../public/static/fonts/Pretendard/Pretendard-Black.woff2',
    //   weight: '900',
    // },
  ],
  variable: '--pretendard',
  // declarations: [
  //   {
  //     prop: 'unicode-range',
  //     value: 'U+AC00-D7A3',
  //   },
  // ],
});
