const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");
const openAiDir = path.join(dist, ".openai");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(openAiDir, { recursive: true });

fs.copyFileSync(
  path.join(root, ".openai", "hosting.json"),
  path.join(openAiDir, "hosting.json")
);

const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

fs.writeFileSync(
  path.join(serverDir, "index.js"),
  `const INDEX_HTML = ${JSON.stringify(indexHtml)};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

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
