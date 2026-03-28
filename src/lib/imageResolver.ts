import fs from "fs";
import path from "path";

/**
 * Reads all image files from a folder in the public directory.
 * @param folderPath Path relative to public directory (e.g. "skills/MySkillPhotos")
 * @returns Array of image paths (e.g. ["/skills/MySkillPhotos/img1.jpg", ...])
 */
export function getImagesFromFolder(folderPath: string | undefined): string[] {
  if (!folderPath) return [];
  
  try {
    const publicPath = path.join(process.cwd(), "public", folderPath);
    if (!fs.existsSync(publicPath)) {
        console.warn(`Folder not found: ${publicPath}`);
        return [];
    }
    
    const files = fs.readdirSync(publicPath);
    return files
      .filter((file) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file))
      .sort((a, b) => {
        // Natural sort for file names (1, 2, 10 instead of 1, 10, 2)
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      })
      .map((file) => `/${folderPath.startsWith('/') ? folderPath.slice(1) : folderPath}/${file}`);
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error);
    return [];
  }
}
