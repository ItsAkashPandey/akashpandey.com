const browserImageCache = new Set<string>();
const browserImagePromises = new Map<string, Promise<void>>();

export function isBrowserImageCached(src: string): boolean {
  return browserImageCache.has(src);
}

export function markBrowserImageLoaded(src: string): void {
  if (!src) return;
  browserImageCache.add(src);
  browserImagePromises.delete(src);
}

export function preloadBrowserImage(src: string): Promise<void> {
  if (!src || typeof window === "undefined") return Promise.resolve();
  if (browserImageCache.has(src)) return Promise.resolve();

  const existing = browserImagePromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";

    const done = () => {
      markBrowserImageLoaded(src);
      resolve();
    };

    image.onload = done;
    image.onerror = done;
    image.src = src;

    if (image.decode) {
      image
        .decode()
        .then(done)
        .catch(() => {
          // onload/onerror will settle the promise when decode races the fetch.
        });
    }
  });

  browserImagePromises.set(src, promise);
  return promise;
}
