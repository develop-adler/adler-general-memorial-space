"use client";
import Image, { StaticImageData } from 'next/image';
import { FC, MouseEvent, useEffect, useState } from 'react';

import { styled, Skeleton, SkeletonProps } from '@mui/material';

type StaticRequire = {
  default: StaticImageData;
};

export type StaticImport = StaticRequire | StaticImageData;

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
  width: number | string;
  height: number | string;
  onError?: () => void;
  fallback?: string | StaticImport;
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
export const SmartIcon: FC<SmartImageProps> = ({
  src,
  hoverSrc,
  draggable,
  alt = 'smart-image',
  animation = 'wave',
  variant = 'rounded',
  loading = 'lazy',
  width,
  height,
  objectFit,
  isCaptureBlocked = true,
  fallback,
  onError,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [postImage, setPostImage] = useState<string | StaticImport | null>(null);

  const onMouseEnter = () => {
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    setIsHovered(false);
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!src || typeof window === 'undefined') return;

    setIsHovered(false);
    function checkImage(thumbnail: string | StaticImport) {
      if (isStaticImport(thumbnail)) {
        setPostImage(thumbnail);
        return;
      }
      const img: HTMLImageElement = new window.Image();
      img.onload = () => setPostImage(thumbnail);
      img.onerror = () => fallback ? setPostImage(fallback) : setPostImage(null);
      img.src = thumbnail;
    }
    checkImage(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);


  if (!src || !postImage) {
    return <RelativeSkeleton animation={animation} variant={variant} width={width as number} height={height as number} onError={onError} />;
  }

  if (isStaticImport(src)) {
    return (
      <RelativeNextImage
        src={isHovered ? hoverSrc ?? src : src}
        // fill
        sizes='100%'
        width={`${width as number}`}
        height={`${height as number}`}
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
      width={width as number}
      height={height as number}
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

const RelativeSkeleton = styled(Skeleton)<
{width: number, 
  height: number,
  variant: CustomSkeletonProps['variant'];
}
>(({width, height, variant}) => ({
  width: `${width}px`,
  height: `${height}px`,
  borderRadius: variant === 'circular' ? '50%' : '0',
}));

const RelativeNextImage = styled(Image)<{
  width: string; 
  height: string;
  variant: CustomSkeletonProps['variant'];}
  >(({ variant, width, height }) => ({
  borderRadius: variant === 'circular' ? '50%' : '0',
  width: width,
  height: height,
}));

const RelativeImg = styled('img')<{
  objectFit?: ObjectFit[];
  variant: CustomSkeletonProps['variant'];
  width: number;
  height: number;
}>(({ objectFit, variant, width, height }) => ({
  width: width,
  height: height,
  borderRadius: variant === 'circular' ? '50%' : '0',
  objectFit: objectFit,
  userSelect: 'none',
}));

