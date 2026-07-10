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

const escapeScriptEnd = (value) => value.replace(/<\/script/gi, "<\\/script");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replace(/<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i, `<style>\n${styles}\n</style>`)
  .replace(/<script\s+src="app\.js"><\/script>/i, `<script>\n${escapeScriptEnd(appScript)}\n</script>`);

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
