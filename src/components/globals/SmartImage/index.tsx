"use client";
import Image, { StaticImageData } from 'next/image';
import { useEffect, useState } from 'react';

import { styled, Skeleton, SkeletonProps } from '@mui/material';

type StaticRequire = {
  default: StaticImageData;
};

type StaticImport = StaticRequire | StaticImageData;

type ObjectFit = 'contain' | 'cover' | 'fill';

type Loading = 'eager' | 'lazy';

type CustomSkeletonProps = Pick<SkeletonProps, 'animation' | 'variant'>;

type SmartImageProps = {
  src?: string | StaticImport | null;
  hoverSrc?: string | StaticImport | null;
  alt?: string;
  loading?: Loading;
  objectFit?: ObjectFit[];
  isCaptureBlocked?: boolean;
  draggable?: boolean;

  onError?: () => void;
} & CustomSkeletonProps;

/**
 * INFO: SmartImage component is a component that can handle both static and dynamic images.
 * - If src data has not set(or forever loading), it will be rendered as a skeleton.
 * - If src data has set, it will be rendered as a next/image component or img element.
 * - case a. src data is string, it will be rendered as a img element.
 * - case b. src data is StaticImport, it will be rendered as a next/image component.
 * - If hoverSrc data has set, src will be changed when hover.
 *
 * Additional INFO:
 * - If you want to using rounded, just set variant prop to 'circular'.
 * - If you want to apply right-click, set contextMenu prop to true.
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  hoverSrc,
  draggable,
  alt = 'smart-image',
  animation = 'wave',
  variant = 'rounded',
  loading = 'lazy',
  objectFit,
  isCaptureBlocked = true,
  onError,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const onMouseEnter = () => {
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    setIsHovered(false);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    setIsHovered(false);
  }, [src]);

  if (!src) {
    return <RelativeSkeleton animation={animation} variant={variant} onError={onError} />;
  }

  if (isStaticImport(src)) {
    return (
      <RelativeNextImage
        src={isHovered ? hoverSrc ?? src : src}
        fill
        sizes='100%'
        alt={alt}
        variant={variant}
        style={{ objectFit: objectFit?.[0] }}
        loading={loading}
        priority={loading !== 'lazy'}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onContextMenu={isCaptureBlocked ? onContextMenu : undefined}
        onError={onError}
        draggable={draggable}
      />
    );
  }

  return (
    <RelativeImg
      src={src}
      loading={loading}
      alt={alt}
      variant={variant}
      objectFit={objectFit}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={isCaptureBlocked ? onContextMenu : undefined}
      onError={onError}
      />
  );
};

const isStaticImport = (src: string | StaticImport): src is StaticImport =>
  (src as StaticRequire).default !== undefined || (src as StaticImageData).src !== undefined;

const RelativeSkeleton = styled(Skeleton)({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100% !important',
  height: '100% !important',
});

const RelativeNextImage = styled(Image)<{
  variant: CustomSkeletonProps['variant'];
}>(({ variant }) => ({
  borderRadius: variant === 'circular' ? '50%' : '0',
}));

const RelativeImg = styled('img')<{
  objectFit?: ObjectFit[];
  variant: CustomSkeletonProps['variant'];
}>(({ objectFit, variant }) => ({
  width: '100% !important',
  height: '100% !important',
  borderRadius: variant === 'circular' ? '50%' : '0',
  objectFit: objectFit,
  userSelect: 'none',
}));

