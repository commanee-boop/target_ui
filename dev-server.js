const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const host = "127.0.0.1";
const preferredPort = Number(process.env.PORT || 5173);
const clients = new Set();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

const liveReloadScript = `
(() => {
  const source = new EventSource("/__events");
  source.addEventListener("reload", () => window.location.reload());
})();
`;

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    let body = data;
    if (ext === ".html") {
      body = data.toString("utf8").replace("</body>", '<script src="/__live-reload.js"></script></body>');
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  });
}

function requestHandler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/__live-reload.js") {
    response.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(liveReloadScript);
    return;
  }

  if (url.pathname === "/__events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive"
    });
    response.write("\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === path.sep || safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  sendFile(response, filePath);
}

function broadcastReload() {
  for (const client of clients) {
    client.write("event: reload\ndata: now\n\n");
  }
}

function watchWorkspace() {
  const watchedExtensions = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg"]);
  let timer = null;

  fs.watch(root, { recursive: true }, (_event, filename) => {
    if (!filename || filename.includes(".git") || filename.includes(".agents")) return;
    if (!watchedExtensions.has(path.extname(filename).toLowerCase())) return;

    clearTimeout(timer);
    timer = setTimeout(broadcastReload, 120);
  });
}

function start(port) {
  const server = http.createServer(requestHandler);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      start(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, host, () => {
    fs.writeFileSync(path.join(root, ".dev-server-port"), String(port));
    watchWorkspace();
    console.log(`Live reload server: http://${host}:${port}/`);
  });
}

start(preferredPort);
