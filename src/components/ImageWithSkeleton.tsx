"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

type ImageWithSkeletonProps = Omit<ImageProps, "onLoadingComplete"> & {
  containerClassName?: string;
  initialLoaded?: boolean;
  skeletonClassName?: string;
};

const loadedSrcCache = new Set<string>();

function getImageCacheKey(src: ImageProps["src"]) {
  if (typeof src === "string") return src;
  return "src" in src ? src.src : JSON.stringify(src);
}

export default function ImageWithSkeleton({
  alt,
  containerClassName,
  initialLoaded = false,
  skeletonClassName,
  className,
  onLoad,
  onError,
  src,
  ...props
}: ImageWithSkeletonProps) {
  const cacheKey = getImageCacheKey(src);
  const [isLoaded, setIsLoaded] = useState(
    () => initialLoaded || loadedSrcCache.has(cacheKey),
  );

  useEffect(() => {
    setIsLoaded(initialLoaded || loadedSrcCache.has(cacheKey));
  }, [cacheKey, initialLoaded]);

  const markLoaded = () => {
    loadedSrcCache.add(cacheKey);
    setIsLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <AnimatePresence initial={false}>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute inset-0 z-10"
          >
            <Skeleton
              aria-hidden
              className={cn(
                "pointer-events-none h-full w-full rounded-none",
                skeletonClassName,
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center transition-opacity duration-100 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
      >
        <Image
          alt={alt}
          src={src}
          {...props}
          decoding={props.decoding ?? "async"}
          style={{
            ...props.style,
            imageOrientation: "from-image",
          }}
          className={cn("relative z-0", className)}
          onLoad={(event) => {
            markLoaded();
            onLoad?.(event);
          }}
          onError={(event) => {
            markLoaded();
            onError?.(event);
          }}
        />
      </div>
    </div>
  );
}
