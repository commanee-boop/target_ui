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

fs.writeFileSync(
  path.join(serverDir, "index.js"),
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    if (url.pathname.includes(".")) return response;

    return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  }
};
`,
  "utf8"
);
