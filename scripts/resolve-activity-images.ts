import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, "..");
const ACTIVITIES_JSON_PATH = path.join(ROOT_DIR, "src/data/activities.json");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]);

function getImagesFromFolder(folderPath: string): string[] {
    try {
        const fullPath = path.join(PUBLIC_DIR, folderPath);

        if (!fs.existsSync(fullPath)) {
            console.warn(`Warning: Folder not found: ${fullPath}`);
            return [];
        }

        const files = fs.readdirSync(fullPath);
        return files
            .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map((file) => `/${folderPath.replace(/^\//, "")}/${file}`);
    } catch (error) {
        console.error(`Error reading image folder ${folderPath}:`, error);
        return [];
    }
}

async function resolveImages() {
    console.log("Resolving activity images...");

    if (!fs.existsSync(ACTIVITIES_JSON_PATH)) {
        console.error(`Error: activities.json not found at ${ACTIVITIES_JSON_PATH}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(ACTIVITIES_JSON_PATH, "utf-8"));

    if (!data.activities || !Array.isArray(data.activities)) {
        console.error("Error: Invalid activities.json format");
        process.exit(1);
    }

    const updatedActivities = data.activities.map((activity: any) => {
        let resolvedImages: string[] = [];

        if (activity.imageFolder) {
            resolvedImages = getImagesFromFolder(activity.imageFolder);
        } else if (activity.images && Array.isArray(activity.images)) {
            resolvedImages = activity.images;
        } else if (activity.image) {
            resolvedImages = [activity.image];
        }

        // Preserve existing resolvedImages if needed, or always overwrite
        return { ...activity, resolvedImages };
    });

    fs.writeFileSync(
        ACTIVITIES_JSON_PATH,
        JSON.stringify({ activities: updatedActivities }, null, 2),
        "utf-8"
    );

    console.log(`Successfully updated ${ACTIVITIES_JSON_PATH} with resolved images.`);
}

resolveImages().catch(console.error);
