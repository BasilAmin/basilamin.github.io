import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(rootDirectory, "dist");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function safePathname(urlValue) {
  try {
    const pathname = decodeURIComponent(new URL(urlValue, "http://localhost").pathname);
    const normalized = path.posix.normalize(pathname).replace(/^\.\.(\/|$)/, "");
    return normalized;
  } catch {
    return "/";
  }
}

async function resolveFile(pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const requested = path.join(outputDirectory, relative);
  const candidates = pathname.endsWith("/")
    ? [path.join(requested, "index.html")]
    : [requested, path.join(requested, "index.html")];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(path.resolve(outputDirectory))) continue;
    try {
      const stat = await fs.stat(resolved);
      if (stat.isFile()) return resolved;
    } catch {
    }
  }

  return path.join(outputDirectory, "404.html");
}

export function startServer({ port = 3000, noStore = false } = {}) {
  const server = http.createServer(async (request, response) => {
    const pathname = safePathname(request.url || "/");
    const file = await resolveFile(pathname);

    try {
      const body = await fs.readFile(file);
      const extension = path.extname(file).toLowerCase();
      response.writeHead(file.endsWith("404.html") ? 404 : 200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": noStore ? "no-store" : extension === ".html" ? "no-cache" : "public, max-age=3600"
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Server error: ${error.message}`);
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Site available at http://127.0.0.1:${port}`);
  });

  return server;
}
