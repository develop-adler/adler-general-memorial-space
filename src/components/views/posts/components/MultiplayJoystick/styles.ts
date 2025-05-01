import { styled } from '@mui/material';

import {
  COLOR,
  GLOBAL_Z_INDEX,
  MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS,
  MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS,
  MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS,
} from '@/constant';

export const INITIAL_JOYSTICK_POSITION =
  MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS - MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS;

export const JoystickSection = styled('div')<{ isLandScape: boolean }>(({ isLandScape }) => ({
  display: 'flex',
  position: 'absolute',
  left: isLandScape ? '2.5rem' : '30px',
  bottom: '130px',
  zIndex: GLOBAL_Z_INDEX.multiplayOverlay,
  width: MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS * 2,
  height: MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS * 2,

  // Commented out for now to remove outer circle
  // background: 'rgba(255, 255, 255, 0.07)',
  // boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.65)',
  pointerEvents: 'all',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
}));

export const JoystickOuterCircle = styled('div')({
  position: 'relative',
  width: MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS * 2,
  height: MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS * 2,
  // border: '.125rem solid rgba(255,255,255,0.5)',
  background: 'rgba(255, 255, 255, 0.15)',
  boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.65)',
  borderRadius: '50%',
});

export const JoyStickCircle = styled('div')({
  position: 'absolute',
  width: MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS * 2,
  height: MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS * 2,
  borderRadius: '50%',
  backgroundColor: COLOR.brandPrimary,
  boxShadow: `0px 0px 4px 0px rgba(0, 0, 0, 0.65)`,
  left: INITIAL_JOYSTICK_POSITION,
  bottom: INITIAL_JOYSTICK_POSITION,
});
