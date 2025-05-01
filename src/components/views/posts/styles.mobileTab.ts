import { styled } from "@mui/material";

import { COLOR, GLOBAL_Z_INDEX } from "@/constant";
import { pretendardFontSetting } from "@/font";

export const Canvas3D = styled("canvas")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  userSelect: "none",
});

export const ToggleButton = styled('div')({
  position: 'absolute',
  top: '2%',
  left: '3%',
  fontSize: '1.5rem',
  fontFamily: `${pretendardFontSetting.style.fontFamily} !important`,
  fontStyle: 'normal',
  fontWeight: '500',
  color: COLOR.black,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '3rem',
  padding: '0.8rem 1rem',
  cursor: 'pointer',
  zIndex: 10,
  userSelect: 'none',
  MozUserSelect: 'none',
  WebkitUserSelect: 'none',
  msUserSelect: 'none',
});

export const JumpButton = styled("div")({
  userSelect: "none",
  pointerEvents: "all",
  cursor: "pointer",
  position: "absolute",
  bottom: "10.18rem",
  right: "1.25rem",
  zIndex: GLOBAL_Z_INDEX.multiplayOverlay,
});
