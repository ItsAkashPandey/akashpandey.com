// Fetches the shiba the corner dog is built from and packs it for the web.
//
// Quaternius's rig, CC0, mirrored by Poly Pizza. It arrives at 831KB, which is
// all geometry and animation curves — there is not a single texture in the
// file, the coat is six flat materials.
//
// Compression is `quantize`, not `draco`. Draco gets it smaller (361KB) but
// needs a 245KB decoder alongside it, so the first load is worse. Quantization
// is KHR_mesh_quantization, which three reads natively with nothing extra.
//
// The packed model is committed. This only needs rerunning if the source
// changes.
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "models");
const WORK_DIR = path.join(ROOT, ".cache", "puppy");

const MODEL = {
  page: "https://poly.pizza/m/y4wdQpg767",
  file: "https://static.poly.pizza/ba6d0ee3-bcc0-4ef0-9d3c-a3e245b41c77.glb",
  out: "shiba.glb",
  author: "Quaternius",
  license: "CC0",
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
}

await fs.mkdir(WORK_DIR, { recursive: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const source = path.join(WORK_DIR, "shiba-source.glb");
const response = await fetch(MODEL.file);
if (!response.ok) throw new Error(`${response.status} ${MODEL.file}`);
await fs.writeFile(source, Buffer.from(await response.arrayBuffer()));

const target = path.join(OUT_DIR, MODEL.out);
await run("npx", [
  "--yes",
  "@gltf-transform/cli@latest",
  "optimize",
  JSON.stringify(source),
  JSON.stringify(target),
  "--compress",
  "quantize",
  "--texture-compress",
  "false",
  "--simplify",
  "false",
]);

const before = (await fs.stat(source)).size;
const after = (await fs.stat(target)).size;

await fs.writeFile(
  path.join(OUT_DIR, "credits.json"),
  `${JSON.stringify(
    {
      note: "Regenerate with `npm run fetch-puppy`.",
      models: [
        {
          file: `models/${MODEL.out}`,
          what: "The shiba in the corner",
          author: MODEL.author,
          license: MODEL.license,
          source: MODEL.page,
          bytes: after,
        },
      ],
    },
    null,
    2,
  )}\n`,
);

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;
process.stdout.write(
  `${kb(before)} → ${kb(after)}  public/models/${MODEL.out}\n`,
);
