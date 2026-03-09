"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

type ImageWithSkeletonProps = Omit<ImageProps, "onLoadingComplete"> & {
  containerClassName?: string;
  skeletonClassName?: string;
};

export default function ImageWithSkeleton({
  alt,
  containerClassName,
  skeletonClassName,
  className,
  onLoad,
  onError,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

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
                skeletonClassName
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="h-full w-full flex items-center justify-center"
      >
        <Image
          alt={alt}
          {...props}
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
