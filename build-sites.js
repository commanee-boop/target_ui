const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");
const openAiDir = path.join(dist, ".openai");
const distAssetsDir = path.join(dist, "assets");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(openAiDir, { recursive: true });

fs.copyFileSync(
  path.join(root, ".openai", "hosting.json"),
  path.join(openAiDir, "hosting.json")
);

fs.cpSync(path.join(root, "assets"), distAssetsDir, { recursive: true });

const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const assetManifest = {};
for (const fileName of fs.readdirSync(distAssetsDir)) {
  const filePath = path.join(distAssetsDir, fileName);
  if (!fs.statSync(filePath).isFile()) {
    continue;
  }

  assetManifest[`/assets/${fileName}`] = {
    data: fs.readFileSync(filePath).toString("base64"),
    type: mimeTypes[path.extname(fileName).toLowerCase()] || "application/octet-stream"
  };
}

fs.writeFileSync(
  path.join(serverDir, "index.js"),
  `const INDEX_HTML = ${JSON.stringify(indexHtml)};
const ASSETS = ${JSON.stringify(assetManifest)};

function decodeBase64(data) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    const asset = ASSETS[url.pathname];

    if (asset) {
      return new Response(decodeBase64(asset.data), {
        headers: {
          "content-type": asset.type,
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }

    if (url.pathname === "/" || (!url.pathname.includes(".") && acceptsHtml)) {
      return new Response(INDEX_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
`,
  "utf8"
);
