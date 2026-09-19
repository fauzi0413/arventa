'use client';

import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

export interface ImageWithSkeletonProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackSrc?: string;
  skeletonClassName?: string;
  containerClassName?: string;
  showIconPlaceholder?: boolean;
}

/**
 * ImageWithSkeleton
 * Automatically displays a smooth skeleton shimmer effect while images are downloading/rendering,
 * and smoothly fades the image in once completely loaded.
 * Also supports graceful fallback when an image fails to load.
 */
export default function ImageWithSkeleton({
  src = '',
  alt,
  fallbackSrc,
  className = '',
  skeletonClassName = '',
  containerClassName = '',
  showIconPlaceholder = true,
  onError,
  onLoad,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || '');
    setIsLoaded(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <div
      className={`relative overflow-hidden ${
        containerClassName || 'w-full h-full'
      }`}
    >
      {/* Skeleton Pulse Loader while image is loading */}
      {!isLoaded && !hasError && (
        <div
          className={`absolute inset-0 z-0 flex items-center justify-center bg-muted/80 dark:bg-muted/60 animate-pulse ${skeletonClassName}`}
        >
          {showIconPlaceholder && (
            <div className="flex items-center justify-center opacity-30">
              <ImageIcon className="h-6 w-6 text-muted-foreground animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Fallback Placeholder on Error */}
      {hasError && !currentSrc && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="h-6 w-6 opacity-40" />
        </div>
      )}

      {/* Real Image Tag with Smooth Opacity Transition */}
      {currentSrc && (
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          className={`${className} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
          onLoad={(e) => {
            setIsLoaded(true);
            if (onLoad) onLoad(e);
          }}
          onError={(e) => {
            if (fallbackSrc && currentSrc !== fallbackSrc) {
              setCurrentSrc(fallbackSrc);
            } else {
              setHasError(true);
              setIsLoaded(true);
            }
            if (onError) onError(e);
          }}
        />
      )}
    </div>
  );
}
