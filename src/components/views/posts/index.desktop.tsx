"use client";

import { useEffect, useRef } from "react";

import * as S from "./styles.desktop";

import { Engine3D } from "@/3d/Engine3D";
import { Scene3D } from "@/3d/Scene3D";

const PostPage: React.FC = () => {
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const scene3DRef = useRef<Scene3D>(null);
  // const giftsShowing = useRef<boolean>(true);

  useEffect(() => {
    if (!canvas3DRef.current) return;
    const engine3D = new Engine3D(canvas3DRef.current);
    const scene3D = new Scene3D(engine3D);
    scene3DRef.current = scene3D;
    window.addEventListener("resize", engine3D.resize.bind(engine3D));
    engine3D.resize();
    return () => {
      window.removeEventListener("resize", engine3D.resize.bind(engine3D));
      scene3D.dispose();
    };
  }, []);

  // const toggleGifts = () => {
  //   if (giftsShowing.current) {
  //     scene3DRef.current?.gifts.forEach((gift) => {
  //       gift.hide();
  //     });
  //     giftsShowing.current = false;
  //   } else {
  //     scene3DRef.current?.gifts.forEach((gift) => {
  //       gift.show();
  //     });
  //     giftsShowing.current = true;
  //   }
  // };

  return (
    <>
      {/* <S.ToggleButton onClick={() => toggleGifts()}>Toggle gifts</S.ToggleButton> */}
      <S.Canvas3D ref={canvas3DRef} />
    </>
  );
};

export default PostPage;
