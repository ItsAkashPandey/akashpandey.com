"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ImageWithSkeletonProps = Omit<ImageProps, "onLoadingComplete"> & {
  containerClassName?: string;
  initialLoaded?: boolean;
  skeletonClassName?: string;
};

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
  const [isLoaded, setIsLoaded] = useState(initialLoaded);

  useEffect(() => {
    setIsLoaded(initialLoaded);
  }, [initialLoaded, src]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton
              aria-hidden
              className={cn(
                "pointer-events-none h-full w-full rounded-none",
                skeletonClassName,
              )}
            />
            {/* Image icon hint so users know content is loading */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <ImageIcon className="text-muted-foreground/20 size-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        className="flex h-full w-full items-center justify-center"
      >
        <Image
          alt={alt}
          src={src}
          {...props}
          decoding={props.decoding ?? "async"}
          className={cn("relative z-0", className)}
          onLoad={(event) => {
            setIsLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            setIsLoaded(true);
            onError?.(event);
          }}
        />
      </motion.div>
    </div>
  );
}
