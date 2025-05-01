export type ObjectTransform = [number, number, number];
export type ObjectQuaternion = [number, number, number, number];
export type Vector2 = { x: number; y: number };

export type User = {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  url: string | null;
  image: string | null;
  isFollowed: boolean;
  followingCount: number;
  followedCount: number;
  postingCount: number;
  multiplayToken: string;
  isGuest?: boolean;
  likeCount?: number;
  giftCount?: number;
};

/**
 * INFO: Sorts formdata according to redoc documentation
 */

export type MentionUser = {
  id: string;
  username: string;
};

export type Post = {
  id: string;
  author: string;
  authorUsername: string;
  authorId: string;
  title: string;
  description: string;
  version: number;
  thumbnail: string | null;
  path: string;
  isLike: boolean;
  createdAt: string;
  userImage: string | null;
  isFollowed: boolean;
  isFavorite: boolean;
  commentCount: number;
  likeCount: number;
  visitCount: number;
  exposeCount: number;
  modifiedFlag: boolean;
  randomLink?: string;
  hashTags: string[];
  giftCount: number;
  mentionUsers: MentionUser[];
  dailyVisits?: number;
  onlineUsers: number;
  remixCount: number;
  favoriteCount: number;
  type?: string;
  weeklyLikes?: number;
  weeklyLikesRank?: number;
  visitStat?: number;
  rank?: number;
};

export type TrinketLocation = {
  x: number;
  y: number;
  z: number;
};

export type TrinketThumbnail = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type PostTrinket = {
  id: string;
  note: string;
  cardUrl: string;
  position: TrinketLocation;
  rotation: TrinketLocation;
  scale: TrinketLocation;
  createdAt: string;
  trinketId: string;
  trinketUrl: string;
  giftProviderUsername: string;
  giftProviderNickname: string;
  giftProviderImage: string;
  isHidden: boolean;
};


export type AvatarGender = 'male' | 'female' | 'other';

export type StudioObjectType =
  | 'themes'
  | 'skyboxs'
  | 'architectures'
  | 'furnitures'
  | 'decorations'
  | 'entertainments'
  | 'sounds'
  | 'images'
  | 'objects';
export type StudioObjectSubType =
  | 'carpet'
  | 'ceiling'
  | 'decoration'
  | 'door'
  | 'floor'
  | 'lighting'
  | 'window'
  | 'bed'
  | 'chair'
  | 'shelf'
  | 'sofa'
  | 'table'
  | 'sound_system'
  | 'wall'
  | 'picture_frame'
  | 'screen'
  | 'structure'
  | 'none';
export type StudioObjectType3D =
  | 'theme'
  | 'wallAttached'
  | 'wall'
  | 'ground'
  | 'decoration'
  | 'floor';

export type StudioObjectProperty = {
  id: string;
  type: StudioObjectType;
  position: ObjectTransform;
  rotation: ObjectTransform;
  scale: ObjectTransform;
  hyperlink?: HyperLinkData;
};
export type StudioArchitectureObjectProperty = StudioObjectProperty & {
  color?: string; // optional only for wall
};
export type StudioDecorationObjectProperty = StudioObjectProperty & {
  image?: string; // only applicable if subtype is picture_frame
  color?: [number, number, number, number]; // RGBA (RGB = 0 - 255, A = 0 - 1), only applicable if subtype is pannel
};

export type StudioImageObjectProperty = {
  id: string;
  type: StudioObjectType;
  position: ObjectTransform;
  rotation: ObjectTransform;
  scale: [number, number];
  hyperlink?: HyperLinkData;
};

export type StudioObject = {
  id: string;
  isPublic: boolean;
  thumbnail: string;
  path: string;
  createdAt: string;
  title: string;
  authorId: string | null;
  authorUsername: string | null;
  authorNickname: string | null;
  type: StudioObjectType;
  subType: StudioObjectSubType;
  threeDUsable: boolean;
};

export type StudioMeshMetaData = {
  id: string;
  name: string;
  type: StudioObjectType;
  type3D: StudioObjectType3D;
  subType: StudioObjectSubType;
  isUserSpawnPlane?: boolean;
  imageContent?: StudioPictureFrameImage;
  hyperlink?: HyperLinkData;
  position: ObjectTransform;
  rotation: ObjectTransform;
  scale: ObjectTransform;
};

export type SoundList = {
  music: { id: string }[];
  shuffle: boolean;
};

export type StudioPostTheme = {
  id: string;
  position: ObjectTransform;
  rotation: ObjectTransform;
  scale: ObjectTransform;
};

export type StudioPost = {
  version: number;
  space: {
    size: number;
    previewCamera: {
      fov: number;
      position: ObjectTransform;
      target: ObjectTransform;
    };
    atom: {
      name: string;
      description: string;
      theme?: StudioPostTheme;
      userSpawnInfo: {
        corners: [ObjectTransform, ObjectTransform, ObjectTransform, ObjectTransform];
        target: ObjectTransform;
      };
      models: {
        skybox: string;
        architectures?: StudioArchitectureObjectProperty[];
        furnitures?: StudioObjectProperty[];
        decorations?: StudioDecorationObjectProperty[];
        entertainments?: StudioObjectProperty[];
        images?: StudioImageObjectProperty[];
        objects?: StudioObjectProperty[];
      };
    };
    sounds?: SoundList;
  };
};

export type StudioPictureFrameImage = {
  src: string;
  file: File;
};

export type HyperLinkData = {
  link: string;
  internalPath?: string;
  description: string;
  useAsPortal: boolean;
};

export type AvatarInteractionType =
  | 'single'
  | 'continuous'
  | 'multi'
  | 'hitting'
  | 'gethit'
  | 'loop';
