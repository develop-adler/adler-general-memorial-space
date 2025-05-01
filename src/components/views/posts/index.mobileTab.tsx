"use client";

import { useEffect, useRef, useState } from "react";

import * as S from "./styles.mobileTab";

import { Engine3D } from "@/3d/Engine3D";
import { Scene3D } from "@/3d/Scene3D";
import { SmartIcon } from "@/components/globals/SmartIcon";
import { MultiplayJoystick } from "@/components/views/posts/components/MultiplayJoystick";

import JumpButton from "#/static/icons/jumpButton.svg";

const JumpButtonComponent = ({ scene3D }: { scene3D: Scene3D }) => {
  return (
    <S.JumpButton
      className="jump-btn"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const avatarController = scene3D.avatarController;
        if (!avatarController) return;
        avatarController.movementKeys.Space = true;
        const preventTouchMove = (event: TouchEvent) => event.preventDefault();
        const handlePointerUp = () => {
          avatarController.movementKeys.Space = false;
          document.removeEventListener("pointerup", handlePointerUp);
          document.removeEventListener("touchmove", preventTouchMove);
        };
        const handleTouchEnd = () => {
          avatarController.movementKeys.Space = false;
          document.removeEventListener("touchend", handleTouchEnd);
          document.removeEventListener("touchcancel", handleTouchEnd);
          document.removeEventListener("touchmove", preventTouchMove);
        };
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
        document.addEventListener("touchmove", preventTouchMove, {
          passive: false,
        });
      }}
    >
      <SmartIcon loading="eager" src={JumpButton} width="70px" height="70px" />
    </S.JumpButton>
  );
};

const PostPage: React.FC = () => {
  const [scene3D, setScene3D] = useState<Scene3D>();

  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const scene3DRef = useRef<Scene3D>(null);
  const giftsShowing = useRef<boolean>(true);

  useEffect(() => {
    if (!canvas3DRef.current) return;
    const engine3D = new Engine3D(canvas3DRef.current);
    const scene3D = new Scene3D(engine3D);
    scene3DRef.current = scene3D;
    setScene3D(scene3D);
    window.addEventListener("resize", engine3D.resize.bind(engine3D));
    return () => {
      window.removeEventListener("resize", engine3D.resize.bind(engine3D));
      scene3D.dispose();
    };
  }, []);

  const toggleGifts = () => {
    if (giftsShowing.current) {
      scene3DRef.current?.gifts.forEach((gift) => {
        gift.hide();
      });
      giftsShowing.current = false;
    } else {
      scene3DRef.current?.gifts.forEach((gift) => {
        gift.show();
      });
      giftsShowing.current = true;
    }
  };

  return (
    <>
      <S.ToggleButton onClick={() => toggleGifts()}>
        Toggle gifts
      </S.ToggleButton>
      <S.Canvas3D ref={canvas3DRef} />
      {scene3D && (
        <>
          <MultiplayJoystick scene3D={scene3D} />
          <JumpButtonComponent scene3D={scene3D} />
        </>
      )}
    </>
  );
};

export default PostPage;
