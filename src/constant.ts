import type {
  AvatarInteractionType,
  StudioObjectSubType,
  StudioObjectType3D,
} from "@/apis/entities";

export const GLOBAL_Z_INDEX = {
  thumbnail: 10,
  itemCanvas: 20,
  canvas3DWrapper: 25,
  itemOverlay: 30,
  multiplayCanvas: 40,
  multiplayOverlay: 50,
  multiplayNavigation: 60,
  multiplayMovementButtons: 62,
  headerOverLay: 65,
  loading: 70,
  channelTalk: 80,
  automationOverlay: 90,
  studioContextMenu: 100,
  loadingScreen: 200,
} as const;

export const COLOR = {
  white: "#FFFFFF",
  black: "#000000",
  disabled: "rgba(0, 0, 0, 0.38)",
  grayScale1: "#00000099",
  grayScale2: "#00000061",
  grayScale10: "#1D1A22",
  grayScale12: "#1D1D1D",
  grayScale15: "#212121",
  grayScale17: "#222222",
  grayScale18: "#2C2F37",
  grayScale20: "#322F37",
  grayScale22: "#333333",
  grayScale25: "#374151",
  grayScale27: "#3C4252",
  grayScale30: "#49454F",
  grayScale40: "#605D66",
  grayScale45: "#6D6D6D",
  grayScale50: "#79747E",
  grayScale52: "#747474",
  grayScale55: "#747579",
  grayScale60: "#938F99",
  grayScale62: "#999999",
  grayScale65: "#9CA3AF",
  grayScale67: "#AAAAAA",
  grayScale70: "#AEA9B4",
  grayScale75: "#BBBBBB",
  grayScale80: "#CAC4D0",
  grayScale82: "#CCCCCC",
  grayScale85: "#D9D9D9",
  grayScale87: "#DDDDDD",
  grayScale90: "#E7E0EC",
  grayScale92: "#F0F0F0",
  grayScale95: "#F5EEFA",
  grayScale97: "#F9F9F9",
  grayScale99: "#FFFBFE",
  grayScale100: "#FFFFFF",
  grayScaleBlack: "#1A141F",
  grayScaleHint: "#4B3A5A",
  brandPrimary: "#FC2D7C",
  brandPrimaryHover: "#FC3E86",
  brandPrimaryHover2: "#FF8EB9",
  brandPrimaryActive: "#FC4F91",
  brandPrimaryDisabled: "#FEAFCD",
  brandSecondary: "#FFE5EF",
  brandSecondaryHover: "#FFE7F0",
  brandSecondaryActive: "#FFE9F2",
  brandSecondaryDisabled: "#FFF5F9",
  badgePrimary: "#FF2F2F",
  notAllowedBackground: "1E1E1E",
  tertiary: "#EEEEEE",
  tertiaryHover: "#EFEFEF",
  tertiaryActive: "#F1F1F1",
  tertiaryDisabled: "#F8F8F8",
  outlineHover: "#FFF7FA",
  outlineActive: "#FEE5EF",
  systemSuccess: "#00B507",
  systemWarning: "#FFC700",
  systemError: "#FF0000",
  systemInfo: "#1700FF",
  systemTag: "#00376B",
  kakao: "#FFE812",
  borderShadow1: "#B4225978",
  socialBackground: "#FC4F91",
  textHigh: "#212121",
  textMedium: "#666666",
  textDisabled: "#9E9E9E",
  textHover: "#333333",
  textActive: "#454545",
  uploadProgress: "#0043CE",
  uploadProgressLight: "#D0E2FF",
  uploadSuccess: "#FC2D7C",
  uploadFailure: "#DA1E28",
  uploadFailureLight: "#FFD7D9",
  uploadUnsupported: "#F1C21B",
  uploadUnsupportedLight: "#F9E59E",
  studioGrayButton: "#8E96A2",
  studioBlueButton: "#5C69E0",
  whiteAlpha: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
  blackAlpha: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  studioXGizmoSub: "#D61A5E",
  studioYGizmo: "#2DFC49",
  studioYGizmoSub: "#188731",
  studioZGizmo: "#2D49FC",
  studioZGizmoSub: "#1D2FA1",

  newAdlerDarkBackground: "#111111",

  interactionWheelBackground: `rgba(17, 17, 17, 0.60)`,
  interactionWheelCircleBorder: `rgba(255, 255, 255, 0.10)`,
  interactionWheelDivider: `rgba(255, 255, 255, 0.15)`,
  interactionWheelPressed: `rgba(176, 0, 68, 0.80)`,
  interactionWheelHovered: `rgba(168, 101, 127, 0.8)`,
  interactionWheelStopButtonBackground: `rgba(17, 17, 17, 0.50)`,

  avatarMultiplayProfileBackground: "#1111118C",
  avatarMultiplayProfileBoxBorder: "#AAAAAA",

  nakamaDebugTextColor: "#cf131f",
};

export const TOP_NAVIGATION_BAR_HEIGHT = "3.5rem";
export const BOTTOM_NAVIGATION_BAR_HEIGHT = "4.5rem";
export const TOP_WEBVIEW_NAVIGATION_BAR_HEIGHT = "3.35rem";
export const BOTTOM_WEBVIEW_NAVIGATION_BAR_HEIGHT = "4.5rem";
export const MOBILE_TOP_NAVIGATION_BAR_HEIGHT = "2.75rem";
export const NEW_WEB_HEADER_HEIGHT = "3.75rem";

export const ADLER_STUDIO_EDIT_HEADER_CONTAINER_HEIGHT = "3.438rem";

export const MULTIPLAY_JOYSTICK_OUTER_CIRCLE_RADIUS = 75;
export const MULTIPLAY_JOYSTICK_MID_CIRCLE_RADIUS = 45;
export const MULTIPLAY_JOYSTICK_OUTER_CIRCLE_BORDER = 2;
export const MULTIPLAY_JOYSTICK_INNER_CIRCLE_RADIUS = 16;

export const STUDIO_OBJECT_TYPE_DICTIONARY: Record<
  StudioObjectSubType,
  StudioObjectType3D
> = {
  ceiling: "decoration",
  window: "decoration",
  lighting: "decoration",
  floor: "floor",
  door: "decoration",
  wall: "ground",
  carpet: "ground",
  chair: "ground",
  shelf: "ground",
  sofa: "ground",
  table: "ground",
  bed: "ground",
  sound_system: "decoration",
  picture_frame: "wallAttached",
  decoration: "decoration",
  screen: "decoration",
  structure: "decoration",
  none: "decoration",
};

export const WORLD_GRAVITY = -29.43; // gravity = -9.81 * 3

export const PHYSICS_SHAPE_FILTER_GROUPS = {
  // don't use 0, it will be ignored, value has to be 2^n
  NONE: 1,
  ENVIRONMENT: 2,
  AVATAR_BODIES_SELF: 4,
  AVATAR_CAPSULE_SELF: 8,
  AVATAR_CAPSULE_OTHER: 16,
  AVATAR_GROUND_CHECK: 32,
} as const;

export const PHYSICS_MOTION_TYPE = {
  STATIC: 0,
  ANIMATED: 1,
  DYNAMIC: 2,
} as const;

export const AVATAR_INTERACTIONS: Record<string, AvatarInteractionType> = {
  Bow: "single",
  Clap: "single",
  Cry: "single",
  Wave: "single",
  HipHopDance: "single", // 'loop',
  Sit: "continuous",
  Kick: "hitting",
  Punch: "hitting",
  HeadFlinch: "gethit",
  ChestFlinch: "gethit",
};

export const AVATAR_PARAMS = {
  CAMERA_HEAD_HEIGHT_MALE: 1.75,
  CAMERA_HEAD_HEIGHT_FEMALE: 1.65,
  CAPSULE_HEIGHT_AVERAGE: 1.75,
  CAPSULE_HEIGHT_FEMALE: 1.7,
  CAPSULE_HEIGHT_MALE: 1.85,
  CAPSULE_RADIUS: 0.2,
  CROUCH_SPHERE_RADIUS: 0.5,
  CAMERA_BETA_LOWER_LIMIT_AVATAR: Math.PI / 4,
  CAMERA_BETA_UPPER_LIMIT_AVATAR: Math.PI / 1.4,
  CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR: 1500,
  CAMERA_HORIZONTAL_ROTATION_SPEED_AVATAR_MOBILE: 750,
  CAMERA_RADIUS_LOWER_AVATAR: 0.5,
  CAMERA_RADIUS_UPPER_AVATAR: 4.8,
  LERP_SPEED_240FPS: 0.05,
  LERP_SPEED_120FPS: 0.1,
  LERP_SPEED_60FPS: 0.2,
} as const;

export const AVATAR_CONTROLLER_PARAMS = {
  CROUCH_SPEED: 1.6,
  WALK_SPEED: 3,
  RUN_SPEED: 6.5,
  JUMP_FORCE: 12,
  FOV_FIRSTPERSON_MOBILE: 1.4,
  FOV_FIRSTPERSON: 1,
  FOV_THIRDPERSON_MOBILE: 1.4,
  FOV_THIRDPERSON: 0.8,
  STAIR_STEP_MAX_HEIGHT: 0.2,
  STAIR_STEP_MIN_DEPTH: 0.12,
  STAIR_DOWN_MAX_HEIGHT: 0.2,
} as const;

export const MULTIPLAYER_PARAMS = {
  DEFAULT_CAMERA_RADIUS: 5,
  CAMERA_BETA_PREVIEW: Math.PI / 2.55,
  CAMERA_HORIZONTAL_ROTATION_SPEED_PREVIEW: 3500,
  CAMERA_MINZ: 0.1,
  CAMERA_MAXZ: 100,
  CAMERA_ALPHA_LOWER_LIMIT_PREVIEW: Math.PI / 3.5,
  CAMERA_ALPHA_UPPER_LIMIT_PREVIEW: Math.PI / 1.4,
  CAMERA_TARGET_PREVIEW: [0, 5, 0],
  CAMERA_TARGET_AVATAR: [0, 1.75, 2.2],
} as const;
