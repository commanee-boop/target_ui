const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const RTAF_MFA_URL = "https://apigw.rtaf.mi.th/login-rtaf-mfa/v2/mfa/login";
const MAX_BODY_BYTES = 16 * 1024;

const STATIC_FILES = new Map([
    ["/", "Home.html"],
    ["/Home.html", "Home.html"],
    ["/index.html", "index.html"],
    ["/login.html", "login.html"],
    ["/config.js", "config.js"],
    ["/qrcode.min.js", "qrcode.min.js"],
    ["/background.png", "background.png"],
    ["/software-center-logo.png", "software-center-logo.png"],
    ["/weaponeering-logo.png", "weaponeering-logo.png"]
]);

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png"
};

function sendJson(response, status, data) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(data));
}

function findNestedField(value, fieldName) {
    if (!value || typeof value !== "object") return undefined;
    if (Object.prototype.hasOwnProperty.call(value, fieldName)) return value[fieldName];

    for (const child of Object.values(value)) {
        const found = findNestedField(child, fieldName);
        if (found !== undefined) return found;
    }
    return undefined;
}

function authenticationRejected(data) {
    if (!data || typeof data !== "object") return false;
    const result = String(data.result || data.status || "").toLowerCase();
    const authorized = findNestedField(data, "authorized");
    return authorized === false
        || data.success === false
        || data.ok === false
        || ["process-error", "error", "failed", "denied", "rejected"].includes(result);
}

function requestRtafMfa(user, pass) {
    const payload = JSON.stringify({ user, pass });

    return new Promise((resolve, reject) => {
        const curl = spawn("curl", [
            "--location",
            "--silent",
            "--show-error",
            "--max-time", "15",
            "--output", "-",
            "--write-out", "\n%{http_code}",
            "--header", "Accept: application/json",
            "--header", "Content-Type: application/json",
            "--data-binary", "@-",
            RTAF_MFA_URL
        ], {
            stdio: ["pipe", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";
        const timeout = setTimeout(() => {
            curl.kill("SIGTERM");
            reject(new Error("UPSTREAM_TIMEOUT"));
        }, 17000);

        curl.stdout.setEncoding("utf8");
        curl.stderr.setEncoding("utf8");
        curl.stdout.on("data", (chunk) => {
            stdout += chunk;
            if (stdout.length > 1024 * 1024) curl.kill("SIGTERM");
        });
        curl.stderr.on("data", (chunk) => {
            stderr += chunk;
        });
        curl.on("error", (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        curl.on("close", (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                reject(new Error(stderr.trim() || `curl exited with code ${code}`));
                return;
            }

            const statusSeparator = stdout.lastIndexOf("\n");
            const status = Number(stdout.slice(statusSeparator + 1));
            if (statusSeparator < 0 || !Number.isInteger(status)) {
                reject(new Error("INVALID_UPSTREAM_RESPONSE"));
                return;
            }

            resolve({
                status,
                contentType: "application/json; charset=utf-8",
                body: stdout.slice(0, statusSeparator)
            });
        });
        curl.stdin.end(payload);
    });
}

async function readJson(request) {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
        chunks.push(chunk);
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new Error("INVALID_JSON");
    }
}

async function proxyMfaLogin(request, response) {
    let body;
    try {
        body = await readJson(request);
    } catch (error) {
        const tooLarge = error.message === "PAYLOAD_TOO_LARGE";
        sendJson(response, tooLarge ? 413 : 400, {
            message: tooLarge ? "ข้อมูลคำขอมีขนาดใหญ่เกินไป" : "รูปแบบข้อมูลไม่ถูกต้อง"
        });
        return;
    }

    const user = String(body?.user || "").trim().toLowerCase().replace(/@rtaf\.mi\.th$/i, "");
    const pass = String(body?.pass || "").trim();

    if (!/^[a-z0-9._-]+$/i.test(user) || !/^\d{6}$/.test(pass)) {
        sendJson(response, 400, { message: "กรุณากรอก Email ทอ. และ OTP 6 หลักให้ถูกต้อง" });
        return;
    }

    try {
        const upstream = await requestRtafMfa(user, pass);
        let parsedBody = null;
        try {
            parsedBody = JSON.parse(upstream.body);
        } catch {
            // ส่งสถานะและข้อความจาก upstream ต่อไปตามเดิมหากไม่ใช่ JSON
        }

        if (upstream.status >= 200 && upstream.status < 300 && authenticationRejected(parsedBody)) {
            sendJson(response, 401, { message: "อีเมลหรือ OTP ไม่ถูกต้อง" });
            return;
        }

        response.writeHead(upstream.status, {
            "Content-Type": upstream.contentType,
            "Cache-Control": "no-store"
        });
        response.end(upstream.body);
    } catch (error) {
        const timedOut = error.message === "UPSTREAM_TIMEOUT";
        console.error("RTAF MFA connection error:", error.code || error.message);
        sendJson(response, 502, {
            message: timedOut
                ? "บริการ RTAF ใช้เวลาตอบกลับนานเกินไป กรุณาลองใหม่"
                : "ไม่สามารถเชื่อมต่อบริการยืนยันตัวตน RTAF ได้"
        });
    }
}

async function serveStatic(pathname, response) {
    const filename = STATIC_FILES.get(pathname);
    if (!filename) {
        sendJson(response, 404, { message: "ไม่พบหน้าที่เรียก" });
        return;
    }

    try {
        const filePath = path.join(ROOT, filename);
        const content = await fs.readFile(filePath);
        response.writeHead(200, {
            "Content-Type": CONTENT_TYPES[path.extname(filename)] || "application/octet-stream",
            "Cache-Control": filename.endsWith(".html") || filename.endsWith(".js") ? "no-cache" : "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer"
        });
        response.end(content);
    } catch {
        sendJson(response, 500, { message: "ไม่สามารถอ่านไฟล์หน้าเว็บได้" });
    }
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

    if (request.method === "POST" && url.pathname === "/api/mfa/login") {
        await proxyMfaLogin(request, response);
        return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
        await serveStatic(url.pathname, response);
        return;
    }

    response.setHeader("Allow", "GET, HEAD, POST");
    sendJson(response, 405, { message: "Method ไม่ถูกต้อง" });
});

server.listen(PORT, HOST, () => {
    console.log(`Weaponeering login: http://${HOST}:${PORT}`);
});
