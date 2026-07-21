import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "./build.mjs";
import { startServer } from "./server-core.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const watchedPaths = [
  path.join(rootDirectory, "content"),
  path.join(rootDirectory, "src"),
  path.join(rootDirectory, "public"),
  path.join(rootDirectory, "site.config.mjs")
];

let rebuildTimer;
let rebuilding = false;
let rebuildQueued = false;

async function rebuild() {
  if (rebuilding) {
    rebuildQueued = true;
    return;
  }

  rebuilding = true;
  try {
    await build();
  } catch (error) {
    console.error(error);
  } finally {
    rebuilding = false;
    if (rebuildQueued) {
      rebuildQueued = false;
      await rebuild();
    }
  }
}

await rebuild();
startServer({ port: Number(process.env.PORT || 3000), noStore: true });

for (const watchedPath of watchedPaths) {
  fs.watch(watchedPath, { recursive: true }, () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 80);
  });
}
